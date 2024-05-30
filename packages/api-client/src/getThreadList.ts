import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { Thread, ListPageProps } from "@/types"

const handler = async (
  req: HandlerRequest<ListPageProps>,
): Promise<HandlerResponse<Thread[]>> => {
  console.log(req.body)

  try {
    const [err, conversationRes] = await request<Thread[]>(
      appConfig.url.getConversationList,
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
        data: conversationRes,
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
