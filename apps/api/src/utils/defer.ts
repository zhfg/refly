export interface Deferred<T = any> {
  promise: Promise<T>;
  resolve: (data?: T | Promise<T>) => void;
  reject: (err?: any) => void;
}

export function Defer<T = any>(): Deferred<T> {
  const self: any = {};
  self.promise = new Promise((resolve, reject) => {
    self.resolve = resolve;
    self.reject = reject;
  });
  Object.freeze(self);
  return self as Deferred<T>;
}
