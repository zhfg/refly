import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import { Conversation } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{ convId: string }>,
): Promise<HandlerResponse<Conversation>> => {
  console.log(req.body)

  try {
    const { convId } = req.body
    const [err, threadRes] = await request<Conversation>(
      appConfig.url.getThreadMessages(convId),
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
