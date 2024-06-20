import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { SkillService } from './skill.service';
import { User } from 'src/utils/decorators/user.decorator';
import {
  User as UserModel,
  Skill as SkillModel,
  SkillTrigger as SkillTriggerModel,
  SkillLog as SkillLogModel,
} from '@prisma/client';
import {
  DeleteSkillRequest,
  DeleteSkillResponse,
  DeleteSkillTriggerRequest,
  DeleteSkillTriggerResponse,
  InvokeSkillRequest,
  InvokeSkillResponse,
  ListSkillLogResponse,
  ListSkillResponse,
  ListSkillTemplateResponse,
  ListSkillTriggerResponse,
  Skill,
  SkillLog,
  SkillTrigger,
  UpsertSkillRequest,
  UpsertSkillResponse,
  UpsertSkillTriggerResponse,
} from '@refly/openapi-schema';
import { buildSuccessResponse, omit } from 'src/utils';

function convertSkill(skill: SkillModel): Skill {
  return {
    ...omit(skill, ['pk', 'deletedAt']),
    createdAt: skill.createdAt.toJSON(),
    updatedAt: skill.updatedAt.toJSON(),
  };
}

function convertSkillTrigger(trigger: SkillTriggerModel): SkillTrigger {
  return {
    ...omit(trigger, ['pk', 'deletedAt']),
    createdAt: trigger.createdAt.toJSON(),
    updatedAt: trigger.updatedAt.toJSON(),
  };
}

function convertSkillLog(log: SkillLogModel): SkillLog {
  return {
    ...omit(log, ['pk']),
    createdAt: log.createdAt.toJSON(),
    updatedAt: log.updatedAt.toJSON(),
  };
}

@Controller('skill')
export class SkillController {
  constructor(private skillService: SkillService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/template/list')
  async listSkillTemplates(): Promise<ListSkillTemplateResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/instance/list')
  async listSkills(
    @User() user: UserModel,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('page', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListSkillResponse> {
    const skills = await this.skillService.listSkills(user, { page, pageSize });
    return buildSuccessResponse(skills.map((skill) => convertSkill(skill)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/new')
  async createSkill(
    @User() user: UserModel,
    @Body() body: UpsertSkillRequest,
  ): Promise<UpsertSkillResponse> {
    const { skill, triggers } = await this.skillService.createSkill(user, body);
    return buildSuccessResponse({
      ...convertSkill(skill),
      triggers: triggers.map((trigger) => convertSkillTrigger(trigger)),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/update')
  async updateSkill(
    @User() user: UserModel,
    @Body() body: UpsertSkillRequest,
  ): Promise<UpsertSkillResponse> {
    const skill = await this.skillService.updateSkill(user, body);
    return buildSuccessResponse(convertSkill(skill));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/delete')
  async deleteSkill(
    @User() user: UserModel,
    @Body() body: DeleteSkillRequest,
  ): Promise<DeleteSkillResponse> {
    await this.skillService.deleteSkill(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/invoke')
  async invokeSkill(
    @User() user: UserModel,
    @Body() body: InvokeSkillRequest,
  ): Promise<InvokeSkillResponse> {
    await this.skillService.invokeSkill(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/streamInvoke')
  async streamInvokeSkill(@User() user: UserModel, @Body() body: InvokeSkillRequest) {
    await this.skillService.invokeSkill(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/trigger/list')
  async listSkillTriggers(
    @User() user: UserModel,
    @Query('skillId') skillId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('page', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListSkillTriggerResponse> {
    const triggers = await this.skillService.listSkillTriggers(user, {
      skillId,
      page,
      pageSize,
    });
    return buildSuccessResponse(triggers.map((trigger) => convertSkillTrigger(trigger)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/trigger/new')
  async createSkillTrigger(
    @User() user: UserModel,
    @Body() body: UpsertSkillRequest,
  ): Promise<UpsertSkillTriggerResponse> {
    const trigger = await this.skillService.createSkillTrigger(user, body);
    return buildSuccessResponse(convertSkillTrigger(trigger));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/trigger/update')
  async updateSkillTrigger(
    @User() user: UserModel,
    @Body() body: UpsertSkillRequest,
  ): Promise<UpsertSkillTriggerResponse> {
    const trigger = await this.skillService.updateSkillTrigger(user, body);
    return buildSuccessResponse(convertSkillTrigger(trigger));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/trigger/delete')
  async deleteSkillTrigger(
    @User() user: UserModel,
    @Body() body: DeleteSkillTriggerRequest,
  ): Promise<DeleteSkillTriggerResponse> {
    await this.skillService.deleteSkillTrigger(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/log/list')
  async listSkillLogs(
    @User() user: UserModel,
    @Query('skillId') skillId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('page', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListSkillLogResponse> {
    const logs = await this.skillService.listSkillLogs(user, {
      skillId: skillId || undefined,
      page,
      pageSize,
    });
    return buildSuccessResponse(logs.map((log) => convertSkillLog(log)));
  }
}
