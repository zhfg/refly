import { InvokeActionRequest } from '@refly-packages/openapi-schema';
import { ActionJob } from '@prisma/client';

export interface InvokeActionJobData extends InvokeActionRequest {
  uid: string;
  rawParam: string;
  job?: Omit<ActionJob, 'pk'>;
}
