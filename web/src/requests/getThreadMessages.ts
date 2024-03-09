import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { Thread } from "@/types"

const handler = async (
  req: HandlerRequest<{ threadId: string }>,
): Promise<HandlerResponse<Thread>> => {
  console.log(req.body)

  try {
    const { threadId } = req.body
    const [err, threadRes] = await request<Thread>(
      appConfig.url.getThreadMessages(threadId),
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
