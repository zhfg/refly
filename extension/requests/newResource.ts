import { appConfig } from "~utils/config"
import { extRequest } from "~utils/request"

import type { HandlerRequest, HandlerResponse } from "~/types/request"
import type { ResourceListItem, ResourceDetail } from "~/types"

const handler = async (
  req: HandlerRequest<Partial<ResourceListItem>>,
): Promise<HandlerResponse<ResourceDetail>> => {
  console.log(req.body)

  try {
    const [err, resourceRes] = await extRequest<ResourceListItem>({
      name: "newResource",
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
        data: resourceRes,
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
