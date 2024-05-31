import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import type { CollectionListItem } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{
    pageSize: number
    page: number
  }>,
): Promise<HandlerResponse<CollectionListItem[]>> => {
  console.log(req.body)

  try {
    const [err, knowledgeBaseList] = await request<CollectionListItem[]>(
      appConfig.url.getKnowledgeBaseList,
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
        data: knowledgeBaseList,
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
