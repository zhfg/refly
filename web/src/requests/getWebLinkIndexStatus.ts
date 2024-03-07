import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { WebLinkItem } from "@/types"

const handler = async (
  req: HandlerRequest<{ url: string }>,
): Promise<HandlerResponse<WebLinkItem[]>> => {
  console.log(req.body)

  try {
    const [err, weblinkListRes] = await request<WebLinkItem[]>(
      appConfig.url.getWeblinkIndexStatus,
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
        data: weblinkListRes,
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
