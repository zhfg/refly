export interface HandlerRequest<T> {
  body: T
}

export interface HandlerResponse<T> {
  data?: T
  success: boolean
  errMsg?: any
}
