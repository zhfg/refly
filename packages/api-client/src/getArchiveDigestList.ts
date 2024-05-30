import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import type { Digest } from "@/types"

const handler = async (
  req: HandlerRequest<{ pageSize: number; page: number; filter?: any }>,
): Promise<HandlerResponse<Digest[]>> => {
  console.log(req.body)

  try {
    const [err, archiveDigestListRes] = await request<Digest[]>(
      appConfig.url.getDigestList,
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
        data: archiveDigestListRes,
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
