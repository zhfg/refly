import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { ResourceDetail } from "@/types"

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
