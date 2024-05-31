import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import type { Thread } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{ pageSize: number; page: number }>,
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
