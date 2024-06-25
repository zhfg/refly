import { Runnable } from '@langchain/core/runnables';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Skill, SkillTrigger, User } from '@prisma/client';
import {
  DeleteSkillRequest,
  DeleteSkillTriggerRequest,
  InvokeSkillRequest,
  SkillTemplate,
  UpsertSkillRequest,
  UpsertSkillTriggerRequest,
} from '@refly/openapi-schema';
import * as templateModule from '@refly/skill-template';
import { genSkillID, genSkillLogID, genSkillTriggerID } from '@refly/utils';
import { PrismaService } from 'src/common/prisma.service';
import { QUEUE_SKILL } from 'src/utils';
import { InvokeSkillJobData } from './skill.dto';

@Injectable()
export class SkillService {
  private logger = new Logger(SkillService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_SKILL) private queue: Queue<InvokeSkillJobData>,
  ) {}

  listSkillTemplates(): SkillTemplate[] {
    return templateModule.inventory;
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
      ...param.triggers?.map((trigger) =>
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

  async skillInvokePreCheck(
    user: User,
    param: InvokeSkillRequest,
  ): Promise<{ skill: Skill; trigger: SkillTrigger; runnable: Runnable }> {
    const { skillId } = param;
    if (!skillId) {
      throw new BadRequestException('skill id is required');
    }
    const skill = await this.prisma.skill.findUnique({
      where: { skillId, uid: user.uid, deletedAt: null },
    });
    if (!skill) {
      throw new BadRequestException('skill not found');
    }
    const trigger = await this.prisma.skillTrigger.findFirst({
      where: {
        skillId,
        event: param.event,
        uid: user.uid,
        deletedAt: null,
      },
    });
    if (!trigger) {
      throw new BadRequestException('skill trigger not found');
    }

    const tpl = templateModule.inventory.find((i) => i.name === skill.skillTpl);
    if (!tpl) {
      throw new BadRequestException('skill template not found');
    }
    const runnable = templateModule[tpl.runnableName];
    if (!runnable) {
      throw new BadRequestException('skill runnable not found');
    }
    return { skill, trigger, runnable: templateModule[tpl.runnableName] };
  }

  async invokeSkill(user: User, param: InvokeSkillRequest) {
    const { skill, trigger } = await this.skillInvokePreCheck(user, param);
    const log = await this.prisma.skillLog.create({
      data: {
        logId: genSkillLogID(),
        uid: user.uid,
        skillId: skill.skillId,
        skillName: skill.name,
        mode: 'async',
        context: JSON.stringify(param.context),
        status: 'scheduling',
        event: param.event,
        triggerId: trigger.triggerId,
      },
    });

    await this.queue.add({ ...param, uid: user.uid, skillLogId: log.logId });

    return log;
  }

  async invokeSkillSync(param: InvokeSkillJobData) {
    const user = await this.prisma.user.findFirst({ where: { uid: param.uid } });
    if (!user) {
      this.logger.warn(`user not found for uid when invoking skill: ${param.uid}`);
      return;
    }
    const { skill, runnable } = await this.skillInvokePreCheck(user, param);

    try {
      await this.prisma.skillLog.update({
        where: { logId: param.skillLogId },
        data: { status: 'running' },
      });
      const res = await runnable.invoke(param.context, {
        configurable: { ...JSON.parse(skill.config), ...param.config },
      });

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

  async streamInvokeSkill(user: User, param: InvokeSkillRequest) {
    const { skill, trigger, runnable } = await this.skillInvokePreCheck(user, param);

    await this.prisma.skillLog.create({
      data: {
        logId: genSkillLogID(),
        uid: user.uid,
        skillId: skill.skillId,
        skillName: skill.name,
        mode: 'stream',
        context: JSON.stringify(param.context),
        status: 'running',
        event: param.event,
        triggerId: trigger.triggerId,
      },
    });

    return runnable.streamEvents(param.context, {
      configurable: { ...JSON.parse(skill.config), ...param.config },
      version: 'v1',
    });
  }

  async listSkillTriggers(
    user: Pick<User, 'uid'>,
    param: { skillId: string; page: number; pageSize: number },
  ) {
    const { skillId, page, pageSize } = param;

    return this.prisma.skillTrigger.findMany({
      where: { uid: user.uid, skillId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillTrigger(user: User, param: UpsertSkillTriggerRequest) {
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
