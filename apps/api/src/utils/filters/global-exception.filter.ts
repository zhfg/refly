import {
  ExceptionFilter,
  HttpStatus,
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import * as Sentry from '@sentry/node';
import { UnknownError } from '@refly-packages/errors';
import { genBaseRespDataFromError } from '@/utils/exception';
import { User } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle http exceptions
    if (exception instanceof HttpException) {
      this.logger.warn(
        `Request: ${request.method} ${request.url} http exception: (${exception.getStatus()}) ${
          exception.message
        }, ` + `stack: ${exception.stack}`,
      );

      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    const user = request.user as User;

    // Handle other business exceptions
    const baseRespData = genBaseRespDataFromError(exception);

    if (baseRespData.errCode === new UnknownError().code) {
      Sentry.captureException(exception, {
        user: {
          id: user?.uid,
          email: user?.email,
        },
      });
      this.logger.error(
        `Request: ${request.method} ${request.url} unknown err: ${exception.stack}`,
      );
    } else {
      this.logger.warn(
        `Request: ${request.method} ${request.url} biz err: ${baseRespData.errMsg}, ` +
          `stack: ${baseRespData.stack}`,
      );
    }

    response.status(HttpStatus.OK).json(baseRespData);
  }
}
