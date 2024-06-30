import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Conversation, Skill, SkillRunMode, SkillTrigger, User } from '@prisma/client';
import { Response } from 'express';
import { AIMessageChunk } from '@langchain/core/dist/messages';
import {
  DeleteSkillRequest,
  DeleteSkillTriggerRequest,
  InvokeSkillRequest,
  ListSkillsData,
  SkillTemplate,
  UpsertSkillRequest,
  UpsertSkillTriggerRequest,
} from '@refly/openapi-schema';
import {
  Scheduler,
  SkillEngine,
  inventory,
  SkillEventMap,
  SkillRunnableConfig,
} from '@refly/skill-template';
import { genSkillID, genSkillLogID, genSkillTriggerID } from '@refly/utils';
import { PrismaService } from 'src/common/prisma.service';
import { QUEUE_SKILL, buildSuccessResponse, writeSSEResponse } from 'src/utils';
import { InvokeSkillJobData } from './skill.dto';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { collectionPO2DTO, resourcePO2DTO } from '../knowledge/knowledge.dto';
import { ConversationService } from '../conversation/conversation.service';

interface SkillPreCheckResult {
  skill?: Skill;
  trigger?: SkillTrigger;
}

@Injectable()
export class SkillService {
  private logger = new Logger(SkillService.name);
  private skillEngine: SkillEngine;

  constructor(
    private prisma: PrismaService,
    private knowledge: KnowledgeService,
    private conversation: ConversationService,
    @InjectQueue(QUEUE_SKILL) private queue: Queue<InvokeSkillJobData>,
  ) {
    this.skillEngine = new SkillEngine(this.logger, {
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
    });
  }

  listSkillTemplates(): SkillTemplate[] {
    return inventory;
  }

  async listSkills(user: Pick<User, 'uid'>, param: { page: number; pageSize: number }) {
    const { page, pageSize } = param;
    return this.prisma.skill.findMany({
      where: { uid: user.uid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkill(user: User, param: UpsertSkillRequest) {
    const skillId = genSkillID();
    const [skill, ...triggers] = await this.prisma.$transaction([
      this.prisma.skill.create({
        data: {
          skillId,
          uid: user.uid,
          name: param.name,
          skillTpl: param.skillTpl,
          config: JSON.stringify(param.config),
        },
      }),
      ...(param.triggers ?? []).map((trigger) =>
        this.prisma.skillTrigger.create({
          data: {
            skillId,
            uid: user.uid,
            triggerId: genSkillTriggerID(),
            event: trigger.event,
            crontab: trigger.crontab,
            enabled: !!trigger.enabled,
          },
        }),
      ),
    ]);
    return { skill, triggers };
  }

  async updateSkill(user: User, param: UpsertSkillRequest) {
    if (!param.skillId) {
      throw new BadRequestException('skill id is required');
    }
    const skill = await this.prisma.skill.update({
      where: { skillId: param.skillId, uid: user.uid },
      data: {
        name: param.name,
        skillTpl: param.skillTpl,
        config: JSON.stringify(param.config),
      },
    });
    return skill;
  }

  async deleteSkill(user: User, param: DeleteSkillRequest) {
    const { skillId } = param;
    if (!skillId) {
      throw new BadRequestException('skill id is required');
    }
    const skill = await this.prisma.skill.findUnique({
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
      this.prisma.skill.update({
        where: { skillId, uid: user.uid },
        data: { deletedAt },
      }),
    ]);
  }

  async skillInvokePreCheck(user: User, param: InvokeSkillRequest): Promise<SkillPreCheckResult> {
    const res: SkillPreCheckResult = {};
    const { skillId } = param;

    if (skillId) {
      const skill = await this.prisma.skill.findUnique({
        where: { skillId, uid: user.uid, deletedAt: null },
      });
      if (!skill) {
        throw new BadRequestException(`skill not found: ${skillId}`);
      }
      res.skill = skill;

      const trigger = await this.prisma.skillTrigger.findFirst({
        where: {
          skillId,
          event: param.event,
          uid: user.uid,
          deletedAt: null,
        },
      });
      if (trigger) {
        res.trigger = trigger;
      }
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
        skillName: skill?.name ?? 'Scheduler',
        mode,
        input: JSON.stringify(param.input),
        context: JSON.stringify(param.context ?? {}),
        overrideConfig: JSON.stringify(param.config ?? {}),
        status: mode === 'async' ? 'scheduling' : 'running',
        event: param.event ?? '',
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
      const scheduler = new Scheduler(this.skillEngine);
      const res = await scheduler.toRunnable().invoke(
        { ...param.input },
        {
          configurable: {
            ...JSON.parse(skill?.config ?? '{}'),
            ...(param.config ?? {}),
            ...param.context,
            uid: user.uid,
          } as SkillRunnableConfig,
        },
      );

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

    const log = await this.createLog(user, param, { skill, trigger }, 'stream');

    const emitter = new EventEmitter<SkillEventMap>();

    emitter.on('on_skill_start', (data) => {
      this.logger.log(`on_skill_start: ${JSON.stringify(data)}`);
      writeSSEResponse(res, {
        event: 'on_skill_start',
        skillName: data.name,
        skillDisplayName: data.showName,
      });
    });
    emitter.on('on_skill_stream', (data) => {
      this.logger.log(`on_skill_stream: ${JSON.stringify(data)}`);
      writeSSEResponse(res, {
        event: 'on_skill_stream',
        skillName: data.name,
        skillDisplayName: data.showName,
        content: data.msg,
      });
      // TODO: save skill messages (need to aggregated for each skill)
    });
    emitter.on('on_skill_end', (data) => {
      this.logger.log(`on_skill_end: ${JSON.stringify(data)}`);
      writeSSEResponse(res, {
        event: 'on_skill_end',
        skillName: data.name,
        skillDisplayName: data.showName,
      });
    });

    const scheduler = new Scheduler(this.skillEngine);
    const runnable = scheduler.toRunnable();

    for await (const event of runnable.streamEvents(
      { ...param.input },
      {
        configurable: {
          ...JSON.parse(skill?.config || '{}'),
          ...param.config,
          ...param.context,
          uid: user.uid,
          emitter,
        } as SkillRunnableConfig,
        version: 'v2',
      },
    )) {
      switch (event.event) {
        case 'on_chat_model_start':
          writeSSEResponse(res, { event: 'on_output_start' });
          break;
        case 'on_chat_model_stream':
          const chunk: AIMessageChunk = event.data?.chunk;
          if (chunk?.tool_call_chunks?.length === 0) {
            writeSSEResponse(res, {
              event: 'on_output_stream',
              content:
                typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content),
            });
          }
          break;
        case 'on_chat_model_end':
          writeSSEResponse(res, { event: 'on_output_end' });
          const { convId } = param.context ?? {};
          let conversation: Conversation | null = null;
          if (convId) {
            conversation = await this.conversation.findConversation(convId);
          }
          await this.conversation.addChatMessages(
            [
              {
                type: 'ai',
                content: JSON.stringify(event.data.output),
                sources: '[]',
                userId: user.id,
                conversationId: conversation?.id ?? 0,
                locale: param.context?.locale ?? user.outputLocale ?? '',
              },
            ],
            {
              id: conversation?.id,
              title: param.input.query,
              userId: user.id,
            },
          );
          break;
      }
    }

    res.end(``);

    await this.prisma.skillLog.update({
      where: { logId: log.logId },
      data: { status: 'finish' },
    });
  }

  async listSkillTriggers(user: Pick<User, 'uid'>, param: ListSkillsData['query']) {
    const { skillId, page = 1, pageSize = 10 } = param!;

    return this.prisma.skillTrigger.findMany({
      where: { uid: user.uid, skillId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillTrigger(user: User, param: UpsertSkillTriggerRequest) {
    if (!param.skillId || !param.event) {
      throw new BadRequestException('skill id and trigger id are required');
    }
    return this.prisma.skillTrigger.create({
      data: {
        uid: user.uid,
        skillId: param.skillId,
        triggerId: genSkillTriggerID(),
        event: param.event,
        crontab: param.crontab,
        enabled: !!param.enabled,
      },
    });
  }

  async updateSkillTrigger(user: User, param: UpsertSkillTriggerRequest) {
    return this.prisma.skillTrigger.update({
      where: { triggerId: param.triggerId, uid: user.uid },
      data: {
        event: param.event,
        crontab: param.crontab,
        enabled: !!param.enabled,
      },
    });
  }

  async deleteSkillTrigger(user: User, param: DeleteSkillTriggerRequest) {
    const { triggerId } = param;
    if (!triggerId) {
      throw new BadRequestException('skill id and trigger id are required');
    }
    const trigger = await this.prisma.skillTrigger.findUnique({
      where: { triggerId, deletedAt: null },
    });
    if (!trigger || trigger.uid !== user.uid) {
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
