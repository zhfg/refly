import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error
    this.logger.error(`Unhandled exception: ${error.message}`, error.stack);

    // You can also customize the response sent back to the client
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
