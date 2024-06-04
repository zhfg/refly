export interface HandlerRequest<T> {
  name: string;
  method?: 'GET' | 'POST' | 'PUT';
  body?: T;
}

export interface HandlerResponse<T> {
  data?: T | null | undefined;
  success: boolean;
  errMsg?: any;
}

export interface BackgroundMessage {
  name: string;
  type: 'apiRequest' | 'others' | 'registerEvent';
  body?: any;
  target: any;
  thisArg: any;
  args: any;
}
