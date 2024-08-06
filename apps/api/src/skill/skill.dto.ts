import { InvokeSkillRequest, SkillInstance, SkillLog, SkillTrigger } from '@refly/openapi-schema';
import {
  SkillInstance as SkillModel,
  SkillTrigger as SkillTriggerModel,
  SkillLog as SkillLogModel,
} from '@prisma/client';
import { pick } from '@/utils';

export interface InvokeSkillJobData extends InvokeSkillRequest {
  uid: string;
  skillLogId: string;
}

export function toSkillDTO(skill: SkillModel): SkillInstance {
  return {
    ...pick(skill, ['skillId', 'skillName']),
    skillDisplayName: skill.displayName,
    config: JSON.parse(skill.config),
    createdAt: skill.createdAt.toJSON(),
    updatedAt: skill.updatedAt.toJSON(),
  };
}

export function toSkillTriggerDTO(trigger: SkillTriggerModel): SkillTrigger {
  return {
    ...pick(trigger, [
      'skillId',
      'triggerType',
      'eventEntityType',
      'eventType',
      'triggerId',
      'crontab',
      'enabled',
    ]),
    createdAt: trigger.createdAt.toJSON(),
    updatedAt: trigger.updatedAt.toJSON(),
  };
}

export function toSkillLogDTO(log: SkillLogModel): SkillLog {
  return {
    ...pick(log, ['logId', 'skillId', 'skillName', 'triggerId']),
    input: JSON.parse(log.input),
    context: JSON.parse(log.context),
    createdAt: log.createdAt.toJSON(),
    updatedAt: log.updatedAt.toJSON(),
  };
}
