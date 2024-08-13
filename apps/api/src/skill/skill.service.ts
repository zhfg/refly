import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  Conversation,
  SkillInstance,
  SkillTrigger,
  MessageType,
  Prisma,
  SkillJob,
} from '@prisma/client';
import { Response } from 'express';
import { AIMessageChunk } from '@langchain/core/dist/messages';
import {
  CreateSkillInstanceRequest,
  CreateSkillTriggerRequest,
  DeleteSkillInstanceRequest,
  DeleteSkillTriggerRequest,
  InvokeSkillRequest,
  ListSkillInstancesData,
  ListSkillJobsData,
  SkillMeta,
  SkillTemplate,
  SkillTriggerCreateParam,
  UpdateSkillInstanceRequest,
  UpdateSkillTriggerRequest,
  User,
} from '@refly/openapi-schema';
import {
  BaseSkill,
  Scheduler,
  SkillEngine,
  SkillEventMap,
  SkillRunnableConfig,
  SkillRunnableMeta,
  createSkillInventory,
} from '@refly/skill-template';
import { genSkillID, genSkillJobID, genSkillTriggerID } from '@refly/utils';
import { PrismaService } from '@/common/prisma.service';
import {
  CHANNEL_INVOKE_SKILL,
  QUEUE_SKILL,
  buildSuccessResponse,
  writeSSEResponse,
  pick,
} from '@/utils';
import { InvokeSkillJobData } from './skill.dto';
import { KnowledgeService } from '@/knowledge/knowledge.service';
import { collectionPO2DTO, resourcePO2DTO } from '@/knowledge/knowledge.dto';
import { ConversationService } from '@/conversation/conversation.service';
import { MessageAggregator } from '@/utils/message';
import { SkillEvent } from '@refly/common-types';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '@/search/search.service';
import { LabelService } from '@/label/label.service';
import { labelClassPO2DTO, labelPO2DTO } from '@/label/label.dto';
import { CreateChatMessageInput } from '@/conversation/conversation.dto';

export type LLMChatMessage = AIMessage | HumanMessage | SystemMessage;

export function createLLMChatMessage(content: string, type: MessageType): LLMChatMessage {
  switch (type) {
    case 'ai':
      return new AIMessage({ content });
    case 'human':
      return new HumanMessage({ content });
    case 'system':
      return new SystemMessage({ content });
    default:
      throw new Error(`invalid message source: ${type}`);
  }
}

function validateSkillTriggerCreateParam(param: SkillTriggerCreateParam) {
  if (param.triggerType === 'event') {
    if (!param.eventType || !param.eventEntityType) {
      throw new BadRequestException('invalid event trigger config');
    }
  } else if (param.triggerType === 'cron') {
    if (!param.crontab) {
      throw new BadRequestException('invalid cron trigger config');
    }
  }
}

interface CreateSkillJobData extends InvokeSkillRequest {
  skill?: SkillInstance;
  triggerId?: string;
  convId?: string;
}

interface SkillInvocationData {
  user: User;
  param: InvokeSkillRequest;
  res?: Response;
  job?: SkillJob;
  conversation?: Conversation;
  skill?: SkillInstance;
  trigger?: SkillTrigger;
}

@Injectable()
export class SkillService {
  private logger = new Logger(SkillService.name);
  private skillEngine: SkillEngine;
  private skillInventory: BaseSkill[];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private label: LabelService,
    private search: SearchService,
    private knowledge: KnowledgeService,
    private conversation: ConversationService,
    @InjectQueue(QUEUE_SKILL) private queue: Queue<InvokeSkillJobData>,
  ) {
    this.skillEngine = new SkillEngine(
      this.logger,
      {
        getResourceDetail: async (user, req) => {
          const resource = await this.knowledge.getResourceDetail(user, req);
          return buildSuccessResponse(resourcePO2DTO(resource, true));
        },
        createResource: async (user, req) => {
          const resource = await this.knowledge.createResource(user, req);
          return buildSuccessResponse(resourcePO2DTO(resource));
        },
        updateResource: async (user, req) => {
          const resource = await this.knowledge.updateResource(user, req);
          return buildSuccessResponse(resourcePO2DTO(resource));
        },
        createCollection: async (user, req) => {
          const coll = await this.knowledge.upsertCollection(user, req);
          return buildSuccessResponse(collectionPO2DTO(coll));
        },
        updateCollection: async (user, req) => {
          const coll = await this.knowledge.upsertCollection(user, req);
          return buildSuccessResponse(collectionPO2DTO(coll));
        },
        createLabelClass: async (user, req) => {
          const labelClass = await this.label.createLabelClass(user, req);
          return buildSuccessResponse(labelClassPO2DTO(labelClass));
        },
        createLabelInstance: async (user, req) => {
          const labels = await this.label.createLabelInstance(user, req);
          return buildSuccessResponse(labels.map((label) => labelPO2DTO(label)));
        },
        search: async (user, req) => {
          const result = await this.search.search(user, req);
          return buildSuccessResponse(result);
        },
      },
      { defaultModel: this.config.get('skill.defaultModel') },
    );
    this.skillInventory = createSkillInventory(this.skillEngine);
  }

  listSkillTemplates(user: User): SkillTemplate[] {
    return this.skillInventory.map((skill) => ({
      name: skill.name,
      displayName: skill.displayName[user.uiLocale || 'en'],
      description: skill.description,
    }));
  }

  isValidSkillName(name: string) {
    return this.skillInventory.some((skill) => skill.name === name);
  }

  async listSkillInstances(user: User, param: ListSkillInstancesData['query']) {
    const { skillId, page, pageSize } = param;
    return this.prisma.skillInstance.findMany({
      where: { skillId, uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillInstance(user: User, param: CreateSkillInstanceRequest) {
    const { uid } = user;
    const { instanceList } = param;

    instanceList.forEach((instance) => {
      if (!this.isValidSkillName(instance.tplName)) {
        throw new BadRequestException(`skill ${instance.tplName} not found`);
      }
    });

    return this.prisma.skillInstance.createManyAndReturn({
      data: instanceList.map((instance) => ({
        skillId: genSkillID(),
        uid,
        tplName: instance.tplName,
        displayName: instance.displayName || 'Untitled Skill',
        config: JSON.stringify(instance.config),
        description: instance.description,
      })),
    });
  }

  async updateSkillInstance(user: User, param: UpdateSkillInstanceRequest) {
    if (!param.skillId) {
      throw new BadRequestException('skill id is required');
    }
    if (param.skillName && !this.isValidSkillName(param.skillName)) {
      throw new BadRequestException(`skill ${param.skillName} not found`);
    }

    const updates: Prisma.SkillInstanceUpdateInput = {
      ...pick(param, ['displayName', 'skillName']),
      ...(param.config ? { config: JSON.stringify(param.config) } : {}),
    };

    if (Object.keys(updates).length === 0) {
      this.logger.log(`no updates for skill instance ${param.skillId}, skip`);
    }

    return this.prisma.skillInstance.update({
      where: { skillId: param.skillId, uid: user.uid, deletedAt: null },
      data: updates,
    });
  }

  async deleteSkillInstance(user: User, param: DeleteSkillInstanceRequest) {
    const { skillId } = param;
    if (!skillId) {
      throw new BadRequestException('skill id is required');
    }
    const skill = await this.prisma.skillInstance.findUnique({
      where: { skillId, deletedAt: null },
    });
    if (!skill || skill.uid !== user.uid) {
      throw new BadRequestException('skill not found');
    }

    // delete skill and triggers
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.skillTrigger.updateMany({
        where: { skillId, uid: user.uid },
        data: { deletedAt },
      }),
      this.prisma.skillInstance.update({
        where: { skillId, uid: user.uid },
        data: { deletedAt },
      }),
    ]);
  }

  async skillInvokePreCheck(user: User, param: InvokeSkillRequest): Promise<SkillInstance | null> {
    const { skillId } = param;

    if (skillId) {
      const skill = await this.prisma.skillInstance.findUnique({
        where: { skillId, uid: user.uid, deletedAt: null },
      });
      if (!skill) {
        throw new BadRequestException(`skill not found: ${skillId}`);
      }
      return skill;
    }

    // Skill not specified, use scheduler
    return null;
  }

  async createJob(user: User, param: CreateSkillJobData) {
    const { input, context, config, skill, triggerId, convId } = param;
    return this.prisma.skillJob.create({
      data: {
        jobId: genSkillJobID(),
        uid: user.uid,
        skillId: skill?.skillId ?? '',
        skillName: skill?.tplName ?? 'Scheduler',
        skillDisplayName: skill?.displayName ?? 'Scheduler',
        input: JSON.stringify(input),
        context: JSON.stringify(context ?? {}),
        overrideConfig: JSON.stringify(config ?? {}),
        status: 'running',
        triggerId,
        convId,
      },
    });
  }

  async sendInvokeSkillTask(user: User, param: InvokeSkillRequest) {
    const skill = await this.skillInvokePreCheck(user, param);
    const job = await this.createJob(user, { ...param, skill });

    await this.queue.add(CHANNEL_INVOKE_SKILL, {
      ...param,
      uid: user.uid,
      jobId: job.jobId,
    });

    return job;
  }

  async buildInvokeConfig(data: {
    user: User;
    skill: SkillInstance;
    param: InvokeSkillRequest;
    conversation?: Conversation;
    eventListener?: (data: SkillEvent) => void;
  }): Promise<SkillRunnableConfig> {
    const { user, skill, param, conversation, eventListener } = data;
    const installedSkills: SkillMeta[] = (
      await this.prisma.skillInstance.findMany({
        where: { uid: user.uid, deletedAt: null },
      })
    ).map((s) => pick(s, ['skillId', 'tplName', 'displayName', 'config']));

    const config: SkillRunnableConfig = {
      configurable: {
        ...JSON.parse(skill?.config ?? '{}'),
        ...(param.config ?? {}),
        ...param.context,
        convId: param.convId,
        uid: user.uid,
        installedSkills,
      },
      user,
    };

    if (skill) {
      config.configurable.selectedSkill = skill;
    }

    if (conversation) {
      const messages = await this.prisma.chatMessage.findMany({
        where: { convId: conversation.convId },
        orderBy: { createdAt: 'asc' },
      });
      config.configurable.chatHistory = messages.map((m) =>
        createLLMChatMessage(m.content, m.type),
      );
    }

    if (eventListener) {
      const emitter = new EventEmitter<SkillEventMap>();

      emitter.on('start', eventListener);
      emitter.on('end', eventListener);
      emitter.on('log', eventListener);
      emitter.on('structured_data', eventListener);

      config.configurable.emitter = emitter;
    }

    return config;
  }

  async invokeSkillFromQueue(param: InvokeSkillJobData) {
    const { uid, jobId, triggerId } = param;
    const user = await this.prisma.user.findFirst({ where: { uid } });
    if (!user) {
      this.logger.warn(`user not found for uid ${uid} when invoking skill: ${uid}`);
      return;
    }

    await this.streamInvokeSkill(user, param, null, jobId, triggerId);
  }

  async streamInvokeSkill(
    user: User,
    param: InvokeSkillRequest,
    res?: Response,
    jobId?: string,
    triggerId?: string,
  ) {
    const skill = await this.skillInvokePreCheck(user, param);

    const data: SkillInvocationData = {
      user,
      param,
      res,
      skill,
    };
    if (param.createConvParam) {
      data.conversation = await this.conversation.upsertConversation(
        user,
        param.createConvParam,
        param.convId,
      );
      param.convId = data.conversation.convId;
    } else if (param.convId) {
      data.conversation = await this.prisma.conversation.findFirst({
        where: { uid: user.uid, convId: param.convId },
      });
      if (!data.conversation) {
        throw new BadRequestException(`conversation not found: ${param.convId}`);
      }
    }

    if (!jobId) {
      const job = await this.createJob(user, { ...param, skill, triggerId });
      jobId = job.jobId;
    }
    data.job = await this.prisma.skillJob.findFirst({ where: { jobId } });

    try {
      await this._invokeSkill(data);
      await this.prisma.skillJob.update({
        where: { jobId },
        data: { status: 'finish' },
      });
    } catch (err) {
      this.logger.error(`invoke skill error: ${err.stack}`);

      await this.prisma.skillJob.update({
        where: { jobId },
        data: { status: 'failed' },
      });
    } finally {
      if (res) {
        res.end(``);
      }
    }
  }

  private async _invokeSkill(data: SkillInvocationData) {
    const { user, param, conversation, skill, res, job } = data;

    const msgAggregator = new MessageAggregator();
    const config = await this.buildInvokeConfig({
      user,
      skill,
      param,
      eventListener: (data: SkillEvent) => {
        if (res) {
          writeSSEResponse(res, data);
        }
        msgAggregator.addSkillEvent(data);
      },
    });
    const scheduler = new Scheduler(this.skillEngine);

    for await (const event of scheduler.streamEvents(
      { ...param.input },
      { ...config, version: 'v2' },
    )) {
      const runMeta = event.metadata as SkillRunnableMeta;
      const chunk: AIMessageChunk = event.data?.chunk ?? event.data?.output;

      // Ignore empty or tool call chunks
      if (!chunk?.content || chunk?.tool_call_chunks?.length > 0) {
        continue;
      }

      switch (event.event) {
        case 'on_chat_model_stream':
          if (res) {
            writeSSEResponse(res, {
              event: 'stream',
              skillMeta: runMeta,
              spanId: runMeta.spanId,
              content:
                typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content),
            });
          }
          break;
        case 'on_chat_model_end':
          msgAggregator.setContent(runMeta, event.data.output.content);
          break;
      }
    }

    const msgList: CreateChatMessageInput[] = msgAggregator.getMessages({
      user,
      convId: conversation?.convId,
      jobId: job?.jobId,
      locale: param.context.locale,
    });

    // If human query is provided, add it to the beginning of the message list
    if (param.input.query) {
      msgList.unshift({
        type: 'human',
        content: param.input.query,
        uid: user.uid,
        convId: conversation?.convId,
        jobId: job?.jobId,
        locale: param.context.locale,
      });
    }

    await this.conversation.addChatMessages(
      msgList,
      conversation
        ? {
            convId: conversation.convId,
            title: param.input.query,
            uid: user.uid,
          }
        : null,
    );
  }

  async listSkillTriggers(user: User, param: ListSkillInstancesData['query']) {
    const { skillId, page = 1, pageSize = 10 } = param!;

    return this.prisma.skillTrigger.findMany({
      where: { uid: user.uid, skillId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillTrigger(user: User, param: CreateSkillTriggerRequest) {
    const { uid } = user;

    if (param.triggerList.length === 0) {
      throw new BadRequestException('trigger list is empty');
    }

    param.triggerList.forEach((trigger) => validateSkillTriggerCreateParam(trigger));

    return this.prisma.skillTrigger.createManyAndReturn({
      data: param.triggerList.map((trigger) => ({
        uid,
        triggerId: genSkillTriggerID(),
        ...pick(trigger, ['skillId', 'triggerType', 'crontab', 'eventEntityType', 'eventType']),
        enabled: !!trigger.enabled,
      })),
    });
  }

  async updateSkillTrigger(user: User, param: UpdateSkillTriggerRequest) {
    return this.prisma.skillTrigger.update({
      where: { triggerId: param.triggerId, uid: user.uid, deletedAt: null },
      data: {
        ...pick(param, ['triggerType', 'eventEntityType', 'eventType', 'crontab', 'enabled']),
        crontab: param.crontab,
        enabled: !!param.enabled,
      },
    });
  }

  async deleteSkillTrigger(user: User, param: DeleteSkillTriggerRequest) {
    const { uid } = user;
    const { triggerId } = param;
    if (!triggerId) {
      throw new BadRequestException('skill id and trigger id are required');
    }
    const trigger = await this.prisma.skillTrigger.findFirst({
      where: { triggerId, uid, deletedAt: null },
    });
    if (!trigger || trigger.uid !== uid) {
      throw new BadRequestException('trigger not found');
    }
    await this.prisma.skillTrigger.update({
      where: { triggerId: trigger.triggerId, uid: user.uid },
      data: { deletedAt: new Date() },
    });
  }

  async listSkillJobs(user: Pick<User, 'uid'>, param: ListSkillJobsData['query']) {
    const { skillId, jobStatus, page, pageSize } = param ?? {};
    return this.prisma.skillJob.findMany({
      where: { uid: user.uid, skillId, status: jobStatus },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async getSkillJobDetail(user: User, jobId: string) {
    if (!jobId) {
      throw new BadRequestException('job id is required');
    }

    const { uid } = user;
    const [job, messages] = await Promise.all([
      this.prisma.skillJob.findUnique({
        where: { uid, jobId },
      }),
      this.prisma.chatMessage.findMany({
        where: { uid, jobId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { ...job, messages };
  }
}
