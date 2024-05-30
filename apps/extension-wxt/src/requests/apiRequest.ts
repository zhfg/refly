import type { HandlerRequest, HandlerResponse } from "@/types/request";
import { sendToBackground } from "@/utils/extension/messaging";

export const apiRequest = async <TRequest = any, TResponse = any>(
  req: HandlerRequest<TRequest>
): Promise<HandlerResponse<TResponse>> => {
  console.log(req.body);

  try {
    const res = await sendToBackground({
      name: req.name,
      body: req.body,
    });

    return res;
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};
