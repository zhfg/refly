import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"

const handler = async (
  req: HandlerRequest<{ sourceId: string }>,
): Promise<HandlerResponse<string>> => {
  console.log(req.body)

  try {
    const { sourceId } = req.body
    const [err, sourceSummaryRes] = await request<string>(
      appConfig.url.getSourceSummary(sourceId),
      {
        method: "GET",
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
        data: sourceSummaryRes,
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
