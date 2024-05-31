import { appConfig } from '@refly-packages/ai-workspace-common/utils/config';
import { request } from '@refly-packages/ai-workspace-common/utils/request';

import type { HandlerRequest, HandlerResponse } from '@refly-packages/ai-workspace-common/types/request';

const handler = async (req: HandlerRequest<{ sourceId: string }>): Promise<HandlerResponse<string>> => {
  console.log(req.body);

  try {
    const { sourceId } = req.body;
    const [err, sourceSummaryRes] = await request<string>(appConfig.url.getSourceSummary(sourceId), {
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
        data: sourceSummaryRes,
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
