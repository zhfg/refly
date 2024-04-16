/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'aero';

export enum SelectorType {
  XPath = 0,
  UNRECOGNIZED = -1,
}

export interface ParseHTMLRequest {
  /** Raw html file */
  html: string;
  /** Content selector type */
  selectorType: SelectorType;
  /** Content selectors */
  selectors: string[];
}

export interface HTMLFragment {
  selectorType: SelectorType;
  selector: string;
  content: string;
}

export interface ParseHTMLResult {
  fragments: HTMLFragment[];
}

export const AERO_PACKAGE_NAME = 'aero';

/** The aero service definition. */

export interface AeroClient {
  /** Parse HTML */

  parseHtml(request: ParseHTMLRequest): Observable<ParseHTMLResult>;
}

/** The aero service definition. */

export interface AeroController {
  /** Parse HTML */

  parseHtml(
    request: ParseHTMLRequest,
  ): Promise<ParseHTMLResult> | Observable<ParseHTMLResult> | ParseHTMLResult;
}

export function AeroControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['parseHtml'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('Aero', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('Aero', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const AERO_SERVICE_NAME = 'Aero';
