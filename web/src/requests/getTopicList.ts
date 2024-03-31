import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { MetaRecord as Topic, ListPageProps } from "@/types"

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
