import {
  EntityType,
  EventType,
  InvokeSkillRequest,
  SkillInstance,
  SkillJob,
  SkillJobStatus,
  SkillTrigger,
  SkillTriggerType,
} from '@refly/openapi-schema';
import {
  SkillInstance as SkillInstanceModel,
  SkillTrigger as SkillTriggerModel,
  SkillJob as SkillJobModel,
  ChatMessage as ChatMessageModel,
} from '@prisma/client';
import { pick } from '@/utils';
import { toChatMessageDTO } from '@/conversation/conversation.dto';

export interface InvokeSkillJobData extends InvokeSkillRequest {
  uid: string;
  jobId?: string;
  triggerId?: string;
}

export function skillInstancePO2DTO(skill: SkillInstanceModel): SkillInstance {
  return {
    skillId: skill.skillId,
    name: skill.skillName,
    displayName: skill.displayName,
    config: JSON.parse(skill.config),
    createdAt: skill.createdAt.toJSON(),
    updatedAt: skill.updatedAt.toJSON(),
  };
}

export function skillTriggerPO2DTO(trigger: SkillTriggerModel): SkillTrigger {
  return {
    ...pick(trigger, ['skillId', 'triggerId', 'crontab', 'enabled']),
    triggerType: trigger.triggerType as SkillTriggerType,
    eventEntityType: trigger.eventEntityType as EntityType,
    eventType: trigger.eventType as EventType,
    createdAt: trigger.createdAt.toJSON(),
    updatedAt: trigger.updatedAt.toJSON(),
  };
}

export function skillJobPO2DTO(job: SkillJobModel & { messages?: ChatMessageModel[] }): SkillJob {
  return {
    ...pick(job, ['jobId', 'skillId', 'skillName', 'skillDisplayName', 'triggerId', 'convId']),
    messages: job.messages?.map(toChatMessageDTO) ?? [],
    jobStatus: job.status as SkillJobStatus,
    input: JSON.parse(job.input),
    context: JSON.parse(job.context),
    createdAt: job.createdAt.toJSON(),
    updatedAt: job.updatedAt.toJSON(),
  };
}
