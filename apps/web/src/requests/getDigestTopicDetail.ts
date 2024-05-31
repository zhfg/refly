import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import { MetaRecord as Topic } from "@refly/ai-workspace-common/types"

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
