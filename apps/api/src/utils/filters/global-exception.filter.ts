import { ExceptionFilter, HttpStatus, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { BaseError, UnknownError } from '@refly-packages/errors';
import { BaseResponse } from '@refly-packages/openapi-schema';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let err: BaseError;

    // Log the error for unknown exception
    if (!(exception instanceof BaseError)) {
      err = new UnknownError(exception);
      Sentry.captureException(exception);
      this.logger.error(
        `Request: ${request.method} ${request.url} unknown err: ${exception.stack}`,
      );
    } else {
      err = exception;
      this.logger.warn(
        `Request: ${request.method} ${request.url} biz err: ${err.toString()}, stack: ${err.stack}`,
      );
    }

    const resp: BaseResponse = {
      success: false,
      errCode: err.code,
      errMsg: err.messageDict['en'],
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    };

    response.status(HttpStatus.OK).json(resp);
  }
}
