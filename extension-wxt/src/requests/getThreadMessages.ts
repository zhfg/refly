import { appConfig } from "@/utils/config";
import { request } from "@/utils/request";

import type { HandlerRequest, HandlerResponse } from "@/types/request";
import { Conversation } from "@/types";

const handler = async (
  req: HandlerRequest<{ convId: string }>
): Promise<HandlerResponse<Conversation>> => {
  console.log(req.body);

  try {
    const { convId } = req.body;
    const [err, threadRes] = await request<Conversation>(
      appConfig.url.getThreadMessages(convId),
      {
        method: "GET",
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
        data: threadRes as Conversation,
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
