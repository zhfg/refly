export interface HandlerRequest<T> {
  name: string;
  body?: T;
}

export interface HandlerResponse<T> {
  data?: T | null | undefined;
  success: boolean;
  errMsg?: any;
}
