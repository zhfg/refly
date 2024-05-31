import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import type { Feed } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{
    pageSize: number
    page: number
  }>,
): Promise<HandlerResponse<Feed[]>> => {
  console.log(req.body)

  try {
    const [err, feedListRes] = await request<Feed[]>(
      appConfig.url.getFeedList,
      {
        method: "GET",
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
        data: feedListRes,
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
