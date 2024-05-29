import { appConfig } from "@/utils/config";
import { request } from "@/utils/request";

import type { HandlerRequest, HandlerResponse } from "@/types/request";
import { Conversation } from "@/types";

const handler = async (
  req: HandlerRequest<{ id: string }>
): Promise<HandlerResponse<Conversation>> => {
  console.log(req.body);

  try {
    const [err, conversationRes] = await request<Conversation>(
      appConfig.url.deleteConversation,
      {
        method: "POST",
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
        data: conversationRes as Conversation,
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
