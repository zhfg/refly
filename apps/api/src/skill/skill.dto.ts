import {
  InvokeSkillRequest,
  SkillInstance,
  SkillLog,
  SkillTrigger,
  SkillTriggerEvent,
} from '@refly/openapi-schema';
import {
  SkillInstance as SkillModel,
  SkillTrigger as SkillTriggerModel,
  SkillLog as SkillLogModel,
} from '@prisma/client';
import { omit } from '@/utils';

export interface InvokeSkillJobData extends InvokeSkillRequest {
  uid: string;
  skillLogId: string;
}

export function toSkillDTO(skill: SkillModel): SkillInstance {
  return {
    ...omit(skill, ['pk', 'uid', 'deletedAt']),
    createdAt: skill.createdAt.toJSON(),
    updatedAt: skill.updatedAt.toJSON(),
  };
}

export function toSkillTriggerDTO(trigger: SkillTriggerModel): SkillTrigger {
  return {
    ...omit(trigger, ['pk', 'uid', 'deletedAt']),
    event: trigger.event as SkillTriggerEvent,
    createdAt: trigger.createdAt.toJSON(),
    updatedAt: trigger.updatedAt.toJSON(),
  };
}

export function toSkillLogDTO(log: SkillLogModel): SkillLog {
  return {
    ...omit(log, ['pk', 'uid']),
    input: JSON.parse(log.input),
    context: JSON.parse(log.context),
    createdAt: log.createdAt.toJSON(),
    updatedAt: log.updatedAt.toJSON(),
  };
}
