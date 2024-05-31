import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import { CollectionDetail } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<{ collectionId: string }>,
): Promise<HandlerResponse<CollectionDetail>> => {
  console.log(req.body)

  try {
    const [err, kbRes] = await request<CollectionDetail>(
      appConfig.url.getKnowledgeBaseDetail,
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
        data: kbRes,
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
