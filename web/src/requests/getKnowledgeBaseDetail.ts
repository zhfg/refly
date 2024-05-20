import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { CollectionDetail } from "@/types"

const handler = async (
  req: HandlerRequest<{ collectionId: string }>,
): Promise<HandlerResponse<CollectionDetail>> => {
  console.log(req.body)

  try {
    const [err, kbRes] = await request<CollectionDetail>(
      appConfig.url.getKnowledgeBaseDetail,
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
