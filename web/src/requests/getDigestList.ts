import { appConfig } from "@/utils/config"
import { request } from "@/utils/request"

import type { HandlerRequest, HandlerResponse } from "@/types/request"
import type { Digest, DigestFilter } from "@/types"

const handler = async (
  req: HandlerRequest<{
    pageSize: number
    page: number
    filter?: DigestFilter
  }>,
): Promise<HandlerResponse<Digest[]>> => {
  console.log(req.body)

  try {
    const [err, fakeDigestListRes] = await request<Digest[]>(
      appConfig.url.getDigestList,
      {
        method: "POST",
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
        data: fakeDigestListRes,
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
