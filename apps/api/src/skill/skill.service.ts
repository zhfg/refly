import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import {
  DeleteSkillRequest,
  DeleteSkillTriggerRequest,
  InvokeSkillRequest,
  UpsertSkillRequest,
  UpsertSkillTriggerRequest,
} from '@refly/openapi-schema';
import { genSkillID, genSkillTriggerID } from '@refly/utils';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class SkillService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

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

  async invokeSkill(user: User, param: InvokeSkillRequest) {
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

    // TODO: invoke the skill
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
