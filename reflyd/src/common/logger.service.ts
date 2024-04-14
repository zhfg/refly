import { Inject, Injectable, Scope } from '@nestjs/common';
import { PinoLogger, Params, PARAMS_PROVIDER_TOKEN } from 'nestjs-pino';
import api from '@opentelemetry/api';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends PinoLogger {
  constructor(@Inject(PARAMS_PROVIDER_TOKEN) params: Params) {
    super(params);
  }

  log(message: any, ...optionalParams: any[]): void {
    const activeSpan = api.trace.getSpan(api.context.active());
    if (activeSpan) {
      activeSpan.addEvent(message);
      this.assign({
        trace_id: activeSpan.spanContext().traceId,
        span_id: activeSpan.spanContext().spanId,
      });
    }

    this.info(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]): void {
    const activeSpan = api.trace.getSpan(api.context.active());
    if (activeSpan) {
      activeSpan.addEvent(message);
      this.assign({
        trace_id: activeSpan.spanContext().traceId,
      });
    }

    this.error(message, ...optionalParams);
  }
}
