import { appConfig } from '@refly-packages/ai-workspace-common/utils/config';
import { request } from '@refly-packages/ai-workspace-common/utils/request';

import type { HandlerRequest, HandlerResponse } from '@refly-packages/ai-workspace-common/types/request';
import { WebLinkItem } from '@refly-packages/ai-workspace-common/types';

const handler = async (req: HandlerRequest<{ url: string }>): Promise<HandlerResponse<WebLinkItem[]>> => {
  console.log(req.body);

  try {
    const [err, weblinkListRes] = await request<WebLinkItem[]>(appConfig.url.getWeblinkIndexStatus, {
      method: 'GET',
      body: req.body,
    });
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: weblinkListRes,
      };
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};

export default handler;
