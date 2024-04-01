import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import type { Feed } from "@/types"

const handler = async (
  req: HandlerRequest<{
    pageSize: number
    page: number
  }>,
): Promise<HandlerResponse<Feed[]>> => {
  console.log(req.body)

  try {
    const [err, feedListRes] = await request<Feed[]>(
      appConfig.url.getDigestList,
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
