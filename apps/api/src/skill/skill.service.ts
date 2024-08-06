import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { Queue } from 'bull';
import pLimit from 'p-limit';
import { InjectQueue } from '@nestjs/bull';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  Conversation,
  SkillInstance,
  SkillRunMode,
  SkillTrigger,
  User,
  MessageType,
} from '@prisma/client';
import { Response } from 'express';
import { AIMessageChunk } from '@langchain/core/dist/messages';
import {
  DeleteSkillInstanceRequest,
  DeleteSkillTriggerRequest,
  InvokeSkillRequest,
  ListSkillInstancesData,
  SkillMeta,
  SkillTemplate,
  UpsertSkillInstanceRequest,
  UpsertSkillTriggerRequest,
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
import { genSkillID, genSkillLogID, genSkillTriggerID } from '@refly/utils';
import { PrismaService } from '@/common/prisma.service';
import { QUEUE_SKILL, buildSuccessResponse, writeSSEResponse, pick } from '@/utils';
import { InvokeSkillJobData } from './skill.dto';
import { KnowledgeService } from '@/knowledge/knowledge.service';
import { collectionPO2DTO, resourcePO2DTO } from '@/knowledge/knowledge.dto';
import { ConversationService } from '@/conversation/conversation.service';
import { MessageAggregator } from '@/utils/message';
import { SkillEvent } from '@refly/common-types';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '@/search/search.service';

interface SkillPreCheckResult {
  skill?: SkillInstance;
  trigger?: SkillTrigger;
}

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

function validateUpsertSkillTriggerRequest(param: UpsertSkillTriggerRequest) {
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

@Injectable()
export class SkillService {
  private logger = new Logger(SkillService.name);
  private skillEngine: SkillEngine;
  private skillInventory: BaseSkill[];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private search: SearchService,
    private knowledge: KnowledgeService,
    private conversation: ConversationService,
    @InjectQueue(QUEUE_SKILL) private queue: Queue<InvokeSkillJobData>,
  ) {
    this.skillEngine = new SkillEngine(
      this.logger,
      {
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
        search: async (user, req) => {
          const result = await this.search.search(user, req);
          return buildSuccessResponse(result);
        },
      },
      { defaultModel: this.config.get('skill.defaultModel') },
    );
    this.skillInventory = createSkillInventory(this.skillEngine);
  }

  listSkillTemplates(): SkillTemplate[] {
    return this.skillInventory.map((skill) => ({
      name: skill.name,
      displayName: skill.displayName,
      description: skill.description,
    }));
  }

  isValidSkillName(name: string) {
    return this.skillInventory.some((skill) => skill.name === name);
  }

  async listSkillInstances(user: Pick<User, 'uid'>, param: { page: number; pageSize: number }) {
    const { page, pageSize } = param;
    return this.prisma.skillInstance.findMany({
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillInstance(user: User, param: UpsertSkillInstanceRequest) {
    const { uid } = user;
    const { instanceList } = param;

    instanceList.forEach((instance) => {
      if (!this.isValidSkillName(instance.skillName)) {
        throw new BadRequestException(`skill ${instance.skillName} not found`);
      }

      instance.triggers?.forEach((trigger) => validateUpsertSkillTriggerRequest(trigger));
    });

    const limit = pLimit(5);
    const tasks = instanceList.map((instance) =>
      limit(async () => {
        const skillId = genSkillID();
        const [skill, ...triggers] = await this.prisma.$transaction([
          this.prisma.skillInstance.create({
            data: {
              skillId,
              uid,
              skillName: instance.skillName,
              displayName: instance.displayName || 'Untitled Skill',
              config: JSON.stringify(instance.config),
            },
          }),
          ...(instance.triggers ?? []).map((trigger) =>
            this.prisma.skillTrigger.create({
              data: {
                skillId,
                uid,
                triggerId: genSkillTriggerID(),
                ...pick(trigger, ['triggerType', 'eventEntityType', 'eventType', 'crontab']),
                enabled: !!trigger.enabled,
              },
            }),
          ),
        ]);
        return { skill, triggers };
      }),
    );

    return Promise.all(tasks);
  }

  async updateSkillInstance(user: User, param: UpsertSkillInstanceRequest) {
    param.instanceList.forEach((instance) => {
      if (!instance.skillId) {
        throw new BadRequestException('skill id is required');
      }
      if (!this.isValidSkillName(instance.skillName)) {
        throw new BadRequestException(`skill ${instance.skillName} not found`);
      }
    });

    const limit = pLimit(5);
    const tasks = param.instanceList.map((instance) =>
      limit(() =>
        this.prisma.skillInstance.update({
          where: { skillId: instance.skillId, uid: user.uid, deletedAt: null },
          data: {
            displayName: instance.displayName,
            skillName: instance.skillName,
            config: JSON.stringify(instance.config),
          },
        }),
      ),
    );

    return Promise.all(tasks);
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

  async skillInvokePreCheck(user: User, param: InvokeSkillRequest): Promise<SkillPreCheckResult> {
    const res: SkillPreCheckResult = {};
    const { skillId } = param;

    if (skillId) {
      const skill = await this.prisma.skillInstance.findUnique({
        where: { skillId, uid: user.uid, deletedAt: null },
      });
      if (!skill) {
        throw new BadRequestException(`skill not found: ${skillId}`);
      }
      res.skill = skill;
    }

    return res;
  }

  async createLog(
    user: User,
    param: InvokeSkillRequest,
    checkResult: SkillPreCheckResult,
    mode: SkillRunMode,
  ) {
    const { skill, trigger } = checkResult;
    return this.prisma.skillLog.create({
      data: {
        logId: genSkillLogID(),
        uid: user.uid,
        skillId: skill?.skillId ?? '',
        skillName: skill?.skillName ?? 'Scheduler',
        mode,
        input: JSON.stringify(param.input),
        context: JSON.stringify(param.context ?? {}),
        overrideConfig: JSON.stringify(param.config ?? {}),
        status: mode === 'async' ? 'scheduling' : 'running',
        triggerId: trigger?.triggerId ?? '',
      },
    });
  }

  async invokeSkill(user: User, param: InvokeSkillRequest) {
    const checkResult = await this.skillInvokePreCheck(user, param);
    const log = await this.createLog(user, param, checkResult, 'async');

    await this.queue.add({ ...param, uid: user.uid, skillLogId: log.logId });

    return log;
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
    ).map((s) => ({
      ...pick(s, ['skillId', 'skillName', 'config']),
      skillDisplayName: s.displayName,
    }));

    const config: SkillRunnableConfig = {
      configurable: {
        ...JSON.parse(skill?.config ?? '{}'),
        ...(param.config ?? {}),
        ...param.context,
        uid: user.uid,
        installedSkills,
      },
    };

    if (skill) {
      config.configurable.selectedSkill = {
        skillId: skill.skillId,
        skillName: skill.skillName,
        skillDisplayName: skill.displayName,
      };
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

  async invokeSkillSync(param: InvokeSkillJobData) {
    const user = await this.prisma.user.findFirst({ where: { uid: param.uid } });
    if (!user) {
      this.logger.warn(`user not found for uid when invoking skill: ${param.uid}`);
      return;
    }
    const { skill } = await this.skillInvokePreCheck(user, param);

    try {
      await this.prisma.skillLog.update({
        where: { logId: param.skillLogId },
        data: { status: 'running' },
      });
      const config = await this.buildInvokeConfig({ user, skill, param });
      const scheduler = new Scheduler(this.skillEngine);
      const res = await scheduler.invoke({ ...param.input }, config);

      this.logger.log(`invoke skill result: ${JSON.stringify(res)}`);
      await this.prisma.skillLog.update({
        where: { logId: param.skillLogId },
        data: { status: 'finish' },
      });
    } catch (err) {
      this.logger.error(`invoke skill error: ${err.stack}`);
      await this.prisma.skillLog.update({
        where: { logId: param.skillLogId },
        data: { status: 'failed' },
      });
    }
  }

  async streamInvokeSkill(user: User, param: InvokeSkillRequest, res: Response) {
    const { skill, trigger } = await this.skillInvokePreCheck(user, param);

    let chatConv: Conversation | null = null;
    if (param.createConvParam) {
      chatConv = await this.conversation.upsertConversation(
        user,
        param.createConvParam,
        param.convId,
      );
    } else if (param.convId) {
      chatConv = await this.prisma.conversation.findFirst({
        where: { uid: user.uid, convId: param.convId },
      });
      if (!chatConv) {
        throw new BadRequestException(`conversation not found: ${param.convId}`);
      }
    }

    const log = await this.createLog(user, param, { skill, trigger }, 'stream');

    const msgAggregator = new MessageAggregator();
    const config = await this.buildInvokeConfig({
      user,
      skill,
      param,
      eventListener: (data: SkillEvent) => {
        writeSSEResponse(res, data);
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
          writeSSEResponse(res, {
            event: 'stream',
            ...pick(runMeta, ['spanId', 'skillId', 'skillName', 'skillDisplayName']),
            content:
              typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content),
          });
          break;
        case 'on_chat_model_end':
          msgAggregator.setContent(runMeta, event.data.output.content);
          break;
      }
    }

    res.end(``);

    if (chatConv?.convId) {
      await this.conversation.addChatMessages(
        [
          {
            type: 'human',
            content: param.input.query,
            uid: user.uid,
            convId: chatConv.convId,
            locale: param.context.locale ?? user.outputLocale,
          },
          ...msgAggregator.getMessages({
            user,
            convId: chatConv.convId,
            locale: param.context.locale ?? user.outputLocale,
          }),
        ],
        {
          convId: chatConv.convId,
          title: param.input.query,
          uid: user.uid,
        },
      );
    }

    await this.prisma.skillLog.update({
      where: { logId: log.logId },
      data: { status: 'finish' },
    });
  }

  async listSkillTriggers(user: Pick<User, 'uid'>, param: ListSkillInstancesData['query']) {
    const { skillId, page = 1, pageSize = 10 } = param!;

    return this.prisma.skillTrigger.findMany({
      where: { uid: user.uid, skillId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillTrigger(user: User, param: UpsertSkillTriggerRequest) {
    const { uid } = user;
    const { skillId } = param;

    if (!param.skillId) {
      throw new BadRequestException('skill id and trigger id are required');
    }

    validateUpsertSkillTriggerRequest(param);

    return this.prisma.skillTrigger.create({
      data: {
        uid,
        skillId,
        triggerId: genSkillTriggerID(),
        ...pick(param, ['skillId', 'triggerType', 'crontab', 'eventEntityType', 'eventType']),
        enabled: !!param.enabled,
      },
    });
  }

  async updateSkillTrigger(user: User, param: UpsertSkillTriggerRequest) {
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

  async listSkillLogs(
    user: Pick<User, 'uid'>,
    param: { skillId?: string; page: number; pageSize: number },
  ) {
    const { skillId, page, pageSize } = param;
    return this.prisma.skillLog.findMany({
      where: { uid: user.uid, skillId },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }
}
