import { appConfig } from '@refly-packages/ai-workspace-common/utils/config';
import { request } from '@refly-packages/ai-workspace-common/utils/request';

import type { HandlerRequest, HandlerResponse } from '@refly-packages/ai-workspace-common/types/request';
import type { Digest } from '@refly-packages/ai-workspace-common/types';

const handler = async (
  req: HandlerRequest<{ pageSize: number; page: number; filter?: any }>,
): Promise<HandlerResponse<Digest[]>> => {
  console.log(req.body);

  try {
    const [err, archiveDigestListRes] = await request<Digest[]>(appConfig.url.getDigestList, {
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
        data: archiveDigestListRes,
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
