import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { getCookie } from "@refly/ai-workspace-common/utils/cookie"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import { User } from "@refly/ai-workspace-common/types"

const handler = async (
  req?: HandlerRequest<any>,
): Promise<HandlerResponse<User>> => {
  console.log(req?.body)

  try {
    const cookie = await getCookie()
    const [err, userRes] = await request<User>(appConfig.url.userSettings, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookie}`, // Include the JWT token in the Authorization header
      },
    })

    if (err) {
      return {
        success: false,
        errMsg: err,
      }
    } else {
      return {
        success: true,
        data: userRes,
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
