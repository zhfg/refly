import { appConfig } from "@refly/ai-workspace-common/utils/config"
import { request } from "@refly/ai-workspace-common/utils/request"

import type {
  HandlerRequest,
  HandlerResponse,
} from "@refly/ai-workspace-common/types/request"
import type { WebLinkItem } from "@refly/ai-workspace-common/types"

const handler = async (
  req: HandlerRequest<Partial<WebLinkItem>>,
): Promise<HandlerResponse<WebLinkItem>> => {
  console.log(req.body)

  try {
    const historyItem = await chrome.history.search({
      text: req.body?.url as string,
    })
    const weblink = { ...(historyItem?.[0] || {}), ...req.body }
    const [err, storeRes] = await request<WebLinkItem>(
      appConfig.url.storeWeblink,
      {
        method: "POST",
        body: {
          data: [weblink],
        },
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
        data: storeRes,
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
