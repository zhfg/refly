import type { HandlerRequest, HandlerResponse } from '@/types/request';

export const apiRequest = async <TRequest = any, TResponse = any>(
  req: HandlerRequest<TRequest>,
): Promise<HandlerResponse<TResponse>> => {
  console.log(req.body);

  try {
    return null as any;
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};
