import {
  InvokeSkillRequest,
  SimpleEventName,
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
    ...pick(skill, ['skillId', 'tplName', 'displayName', 'description']),
    invocationConfig: JSON.parse(skill.invocationConfig),
    createdAt: skill.createdAt.toJSON(),
    updatedAt: skill.updatedAt.toJSON(),
  };
}

export function skillTriggerPO2DTO(trigger: SkillTriggerModel): SkillTrigger {
  return {
    ...pick(trigger, ['skillId', 'triggerId', 'enabled']),
    ...{
      simpleEventName: trigger.simpleEventName as SimpleEventName,
      timerConfig: trigger.timerConfig ? JSON.parse(trigger.timerConfig) : undefined,
      input: trigger.input ? JSON.parse(trigger.input) : undefined,
      context: trigger.context ? JSON.parse(trigger.context) : undefined,
    },
    triggerType: trigger.triggerType as SkillTriggerType,
    createdAt: trigger.createdAt.toJSON(),
    updatedAt: trigger.updatedAt.toJSON(),
  };
}

export function skillJobPO2DTO(job: SkillJobModel & { messages?: ChatMessageModel[] }): SkillJob {
  return {
    ...pick(job, ['jobId', 'skillId', 'skillDisplayName', 'triggerId', 'convId']),
    messages: job.messages?.map(toChatMessageDTO) ?? [],
    jobStatus: job.status as SkillJobStatus,
    input: JSON.parse(job.input),
    context: JSON.parse(job.context),
    createdAt: job.createdAt.toJSON(),
    updatedAt: job.updatedAt.toJSON(),
  };
}
