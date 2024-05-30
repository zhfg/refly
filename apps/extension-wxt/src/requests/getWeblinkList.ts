import { appConfig } from "@/utils/config";
import { request } from "@/utils/request";

import type { HandlerRequest, HandlerResponse } from "@/types/request";
import type { WebLinkItem, ListPageProps } from "@/types";

const handler = async (
  req: HandlerRequest<ListPageProps>
): Promise<HandlerResponse<WebLinkItem[]>> => {
  console.log(req.body);

  try {
    const [err, weblinkListRes] = await request<WebLinkItem[]>(
      appConfig.url.getWeblinkList,
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
        data: weblinkListRes,
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
