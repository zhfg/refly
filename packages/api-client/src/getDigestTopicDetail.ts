import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { MetaRecord as Topic } from "@/types"

const handler = async (
  req: HandlerRequest<{ digestTopicId: string }>,
): Promise<HandlerResponse<Topic>> => {
  console.log(req.body)

  try {
    const { digestTopicId } = req.body
    const [err, threadRes] = await request<Topic>(
      appConfig.url.getTopicDetail(digestTopicId),
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
        data: threadRes,
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
