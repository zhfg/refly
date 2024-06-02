import { Request } from 'express';
import { User as UserModel } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string };
    }
  }
}
