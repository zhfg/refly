export interface HandlerRequest<T> {
  body: T;
}

export interface HandlerResponse<T> {
  data?: T | null | undefined;
  success: boolean;
  errMsg?: any;
}
