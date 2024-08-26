import { Request, Response, NextFunction } from 'express';

// Slow down the request, used to simulate the situation where network is bad
export function slowdown(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => next(), parseInt(process.env.SLOWDOWN_TIME || '0'));
  } else {
    next();
  }
}
