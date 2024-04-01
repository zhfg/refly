import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import { Digest } from "@/types"

const handler = async (
  req: HandlerRequest<{ digestId: string }>,
): Promise<HandlerResponse<Digest>> => {
  console.log(req.body)

  try {
    const { digestId } = req.body
    const [err, digestRes] = await request<Digest>(
      appConfig.url.getDigestDetail(digestId),
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
        data: digestRes,
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
