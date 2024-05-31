import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import { Topic, ListPageProps } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<ListPageProps>,
): Promise<HandlerResponse<{ list: Topic[]; total: number }>> => {
  console.log(req.body)

  try {
    const [err, topicRes] = await request<{ list: Topic[]; total: number }>(
      appConfig.url.getTopicList,
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
        data: topicRes,
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
