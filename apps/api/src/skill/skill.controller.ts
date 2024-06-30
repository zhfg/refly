import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { SkillService } from './skill.service';
import { User } from 'src/utils/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';
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
  UpsertSkillRequest,
  UpsertSkillResponse,
  UpsertSkillTriggerRequest,
  UpsertSkillTriggerResponse,
} from '@refly/openapi-schema';
import { buildSuccessResponse } from 'src/utils';
import { Response } from 'express';
import { toSkillDTO, toSkillLogDTO, toSkillTriggerDTO } from './skill.dto';

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
    return buildSuccessResponse(skills.map((skill) => toSkillDTO(skill)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/new')
  async createSkill(
    @User() user: UserModel,
    @Body() body: UpsertSkillRequest,
  ): Promise<UpsertSkillResponse> {
    const { skill, triggers } = await this.skillService.createSkill(user, body);
    return buildSuccessResponse({
      ...toSkillDTO(skill),
      triggers: triggers.map((trigger) => toSkillTriggerDTO(trigger)),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instance/update')
  async updateSkill(
    @User() user: UserModel,
    @Body() body: UpsertSkillRequest,
  ): Promise<UpsertSkillResponse> {
    const skill = await this.skillService.updateSkill(user, body);
    return buildSuccessResponse(toSkillDTO(skill));
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
  @Post('/invoke')
  async invokeSkill(
    @User() user: UserModel,
    @Body() body: InvokeSkillRequest,
  ): Promise<InvokeSkillResponse> {
    await this.skillService.invokeSkill(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('/streamInvoke')
  async streamInvokeSkill(
    @User() user: UserModel,
    @Body() body: InvokeSkillRequest,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(200);

    await this.skillService.streamInvokeSkill(user, body, res);
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
    return buildSuccessResponse(triggers.map((trigger) => toSkillTriggerDTO(trigger)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/trigger/new')
  async createSkillTrigger(
    @User() user: UserModel,
    @Body() body: UpsertSkillTriggerRequest,
  ): Promise<UpsertSkillTriggerResponse> {
    const trigger = await this.skillService.createSkillTrigger(user, body);
    return buildSuccessResponse(toSkillTriggerDTO(trigger));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/trigger/update')
  async updateSkillTrigger(
    @User() user: UserModel,
    @Body() body: UpsertSkillTriggerRequest,
  ): Promise<UpsertSkillTriggerResponse> {
    const trigger = await this.skillService.updateSkillTrigger(user, body);
    return buildSuccessResponse(toSkillTriggerDTO(trigger));
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
    return buildSuccessResponse(logs.map((log) => toSkillLogDTO(log)));
  }
}
