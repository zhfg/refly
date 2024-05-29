export interface HandlerRequest<T> {
  body: T;
}

export interface HandlerResponse<T> {
  data?: T | null;
  success: boolean;
  errMsg?: any;
}
