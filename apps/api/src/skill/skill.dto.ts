import { InvokeSkillRequest } from '@refly/openapi-schema';

export interface InvokeSkillJobData extends InvokeSkillRequest {
  uid: string;
  skillLogId: string;
}
