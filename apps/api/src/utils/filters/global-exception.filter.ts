import { ExceptionFilter, HttpStatus, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import * as Sentry from '@sentry/node';
import { UnknownError } from '@refly-packages/errors';
import { genBaseRespDataFromError } from '@/utils/exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const baseRespData = genBaseRespDataFromError(exception);

    if (baseRespData.errCode === new UnknownError().code) {
      Sentry.captureException(exception);
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
