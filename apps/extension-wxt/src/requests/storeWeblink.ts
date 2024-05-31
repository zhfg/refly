import { appConfig } from '@/utils/config';
import { extRequest } from '@/utils/request';

import type { HandlerRequest, HandlerResponse } from '@/types/request';
import type { WebLinkItem } from '@/types';

const handler = async (req: HandlerRequest<Partial<WebLinkItem>>): Promise<HandlerResponse<WebLinkItem>> => {
  console.log(req.body);

  try {
    const historyItem = await browser.history.search({
      text: req.body?.url as string,
    });
    const weblink = { ...(historyItem?.[0] || {}), ...req.body };
    const [err, storeRes] = await extRequest<WebLinkItem>(appConfig.url.storeWeblink, {
      method: 'POST',
      body: {
        data: [weblink],
      },
    });
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: storeRes,
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
