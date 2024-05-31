import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import { ResourceDetail } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{ resourceId: string }>,
): Promise<HandlerResponse<ResourceDetail>> => {
  console.log(req.body)

  try {
    const [err, resourceRes] = await request<ResourceDetail>(
      appConfig.url.getResourceDetail,
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
        data: resourceRes,
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
