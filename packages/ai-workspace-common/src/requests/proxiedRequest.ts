import React from 'react';
import { client } from '@refly/openapi-schema';
import * as requestModule from '@refly/openapi-schema';
import { Button, notification } from 'antd';
import { IconCopy } from '@arco-design/web-react/icon';

import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getAuthTokenFromCookie } from '@refly-packages/ai-workspace-common/utils/request';
import { getServerOrigin } from '@refly/utils/url';
import { sendToBackground } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { LOCALE, MessageName } from '@refly/common-types';
import { ConnectionError, getErrorMessage, OperationTooFrequent, UnknownError } from '@refly/errors';
import { safeParseJSON, safeStringifyJSON } from '@refly-packages/utils/parse';
import { BaseResponse } from '@refly/openapi-schema';

client.setConfig({ baseUrl: getServerOrigin() + '/v1' });

client.interceptors.request.use((request) => {
  const token = getAuthTokenFromCookie();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

const errTitle = {
  en: 'Oops, something went wrong',
  'zh-CN': '哎呀，出错了',
};

const getLocale = () => {
  const settings = safeParseJSON(localStorage.getItem('refly-local-settings'));
  return settings?.uiLocale || 'en';
};

export interface CheckResponseResult {
  isError: boolean;
  baseResponse?: BaseResponse;
}

export const extractBaseResp = async (response: Response): Promise<BaseResponse> => {
  if (!response.ok) {
    return response.status === 429
      ? {
          success: false,
          errCode: new OperationTooFrequent().code,
        }
      : {
          success: false,
          errCode: new UnknownError().code,
        };
  }

  if (response.headers.get('Content-Type')?.includes('application/json')) {
    const clonedResponse = response.clone();
    return await clonedResponse.json();
  }

  return { success: true };
};

export const showErrorNotification = (res: BaseResponse, locale: LOCALE) => {
  const { errCode, traceId } = res;
  const errMsg = getErrorMessage(errCode || new UnknownError().code, locale);

  const description = React.createElement(
    'div',
    null,
    React.createElement('div', null, errMsg),
    traceId &&
      React.createElement(
        'div',
        {
          style: {
            marginTop: 8,
            fontSize: 11,
            color: '#666',
            display: 'flex',
            alignItems: 'center',
          },
        },
        React.createElement('div', null, `Trace ID: ${traceId}`),
        React.createElement(
          Button,
          {
            type: 'link',
            size: 'small',
            onClick: () => {
              navigator.clipboard.writeText(traceId);
              notification.success({
                message: locale === 'zh-CN' ? '已复制' : 'Copied',
                duration: 2,
              });
            },
          },
          React.createElement(IconCopy, { style: { fontSize: 14, color: '#666' } }),
        ),
      ),
  );

  notification.error({
    message: errTitle[locale],
    description,
  });
};

client.interceptors.response.use(async (response) => {
  const error = await extractBaseResp(response);
  if (!error.success) {
    showErrorNotification(error, getLocale());
  }
  return response;
});

const wrapFunctions = (module: any) => {
  const wrappedModule: any = {};

  for (const key of Reflect.ownKeys(module)) {
    const origMethod = module[key];

    const runtime = getRuntime() || '';
    if (runtime.includes('extension') && typeof origMethod === 'function') {
      wrappedModule[key] = async function (...args: unknown[]) {
        console.log(`Calling function ${String(key)} with arguments: ${safeStringifyJSON(args)}`);

        try {
          return await sendToBackground({
            name: String(key) as MessageName,
            type: 'apiRequest',
            source: getRuntime(),
            target: module,
            args,
          });
        } catch (err) {
          const errResp = {
            success: false,
            errCode: new ConnectionError(err).code,
          };
          showErrorNotification(errResp, getLocale());
          return errResp;
        }
      };
    } else {
      wrappedModule[key] = async (...args: unknown[]) => {
        try {
          return await origMethod(...args);
        } catch (err) {
          const errResp = {
            success: false,
            errCode: new ConnectionError(err).code,
          };
          showErrorNotification(errResp, getLocale());
          return errResp;
        }
      };
    }
  }

  return wrappedModule as typeof requestModule;
};

const wrappedRequestModule = () => {
  return wrapFunctions(requestModule);
};

export default wrappedRequestModule;
