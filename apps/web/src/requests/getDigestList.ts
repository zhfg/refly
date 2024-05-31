import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import type { Digest, DigestFilter } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{
    pageSize: number
    page: number
    filter?: DigestFilter
  }>,
): Promise<HandlerResponse<Digest[]>> => {
  console.log(req.body)

  try {
    const [err, fakeDigestListRes] = await request<Digest[]>(
      appConfig.url.getDigestList,
      {
        method: "POST",
        body: req.body,
      },
    )
    if (err) {
      return {
        success: false,
        errMsg: err,
      }
    } else {
      return {
        success: true,
        data: fakeDigestListRes,
      }
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    }
  }
}

export default handler
