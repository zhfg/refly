import { Request, Response, NextFunction } from 'express';

export function setRayID(req: Request, res: Response, next: NextFunction) {
  next();
  if (req.header('X-Ray-ID')) {
    res.setHeader('X-Ray-ID', req.header('X-Ray-ID'));
  }
}
