import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { MetaRecord as Topic, ListPageProps } from "@/types"

const handler = async (
  req: HandlerRequest<ListPageProps>,
): Promise<HandlerResponse<Topic[]>> => {
  console.log(req.body)

  try {
    const [err, topicRes] = await request<Topic[]>(appConfig.url.getTopicList, {
      method: "GET",
      body: req.body,
    })
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
