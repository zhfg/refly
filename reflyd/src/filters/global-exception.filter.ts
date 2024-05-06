import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error
    Sentry.captureException(error);
    this.logger.error(`Request: ${request.method} ${request.url}`, error);

    // You can also customize the response sent back to the client
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
