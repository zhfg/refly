import type { HandlerRequest, HandlerResponse } from '@/types/request';
import { sendToBackground } from '@/utils/extension/messaging';

export const apiRequest = async <TRequest = any, TResponse = any>(
  req: HandlerRequest<TRequest>,
): Promise<HandlerResponse<TResponse>> => {
  console.log(req.body);

  try {
    const res = await sendToBackground({
      ...req,
    });

    return res;
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};
