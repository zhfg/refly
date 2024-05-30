import { WebLinkItem } from "@/types";
import type { HandlerRequest, HandlerResponse } from "@/types/request";
import { appConfig } from "@/utils/config";
import { request } from "@/utils/request";

const handler = async (
  req: HandlerRequest<WebLinkItem>
): Promise<HandlerResponse<WebLinkItem>> => {
  console.log(req.body);

  try {
    const [err, storeRes] = await request<WebLinkItem>(
      appConfig.url.pingWebLinkStatus,
      {
        method: "GET",
        body: req.body,
      }
    );
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: storeRes,
      };
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};

export default handler;
