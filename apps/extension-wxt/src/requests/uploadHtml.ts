import { appConfig } from '@/utils/config';
import { extRequest } from '@/utils/request';

import type { HandlerRequest, HandlerResponse } from '@refly/common-types';

import { getServerlessWorkOrigin } from '@refly/utils/url';
import { HtmlUploadRequest, HtmlUploadResult } from '@refly/common-types';

const handler = async (req: HandlerRequest<HtmlUploadRequest>): Promise<HandlerResponse<HtmlUploadResult>> => {
  console.log(req.body);

  try {
    const BASEURL = getServerlessWorkOrigin();

    const { pageContent = '', url = '', fileName = '' } = req.body as HtmlUploadRequest;

    const formData = new FormData();
    const blob = new Blob([pageContent], { type: 'text/html' });
    const file = new File([blob], fileName || `test.html`, {
      type: 'text/html',
    });

    formData.append('file', file);
    formData.append('url', url);

    const [err, uploadHtmlRes] = await extRequest<HtmlUploadResult>(`${BASEURL}${appConfig.url.uploadHtml}`, {
      method: 'POST',
      body: formData,
    });
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: uploadHtmlRes,
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
