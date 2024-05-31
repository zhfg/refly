import { appConfig } from '@refly-packages/ai-workspace-common/utils/config';
import { request } from '@refly-packages/ai-workspace-common/utils/request';

import type { HandlerRequest, HandlerResponse } from '@refly-packages/ai-workspace-common/types/request';
import { Digest } from '@refly-packages/ai-workspace-common/types';

const handler = async (req: HandlerRequest<{ contentId: string }>): Promise<HandlerResponse<Digest>> => {
  console.log(req.body);

  try {
    const { contentId } = req.body;
    const [err, digestRes] = await request<Digest>(appConfig.url.getAIGCContent(contentId), {
      method: 'GET',
    });
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: digestRes,
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
