export abstract class BaseError extends Error {
  abstract code: string;
  abstract messageDict: Record<string, string>;

  constructor(message?: string) {
    super(message);
  }
}
