import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  BaseResponse,
  CreateLabelClassRequest,
  CreateLabelInstanceRequest,
  DeleteLabelClassRequest,
  DeleteLabelInstanceRequest,
  EntityType,
  ListLabelClassesResponse,
  ListLabelInstancesResponse,
  UpdateLabelClassRequest,
  UpdateLabelInstanceRequest,
  UpsertLabelClassResponse,
  UpsertLabelInstanceResponse,
} from '@refly/openapi-schema';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '@/utils';
import { LabelService } from '@/label/label.service';
import { User } from '@/utils/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';
import { labelClassPO2DTO, labelPO2DTO } from '@/label/label.dto';

@Controller('label')
export class LabelController {
  constructor(private labelService: LabelService) {}

  @UseGuards(JwtAuthGuard)
  @Get('class/list')
  async listLabelClasses(
    @User() user: UserModel,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListLabelClassesResponse> {
    const classes = await this.labelService.listLabelClasses(user, { page, pageSize });
    return buildSuccessResponse(classes.map((lc) => labelClassPO2DTO(lc)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('class/new')
  async createLabelClass(
    @User() user: UserModel,
    @Body() body: CreateLabelClassRequest,
  ): Promise<UpsertLabelClassResponse> {
    const lc = await this.labelService.createLabelClass(user, body);
    return buildSuccessResponse(labelClassPO2DTO(lc));
  }

  @UseGuards(JwtAuthGuard)
  @Post('class/update')
  async updateLabelClass(
    @User() user: UserModel,
    @Body() body: UpdateLabelClassRequest,
  ): Promise<UpsertLabelClassResponse> {
    const lc = await this.labelService.updateLabelClass(user, body);
    return buildSuccessResponse(labelClassPO2DTO(lc));
  }

  @UseGuards(JwtAuthGuard)
  @Post('class/delete')
  async deleteLabelClass(
    @User() user: UserModel,
    @Body() body: DeleteLabelClassRequest,
  ): Promise<BaseResponse> {
    await this.labelService.deleteLabelClass(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('instance/list')
  async listLabelInstances(
    @User() user: UserModel,
    @Query('entityType') entityType: EntityType,
    @Query('entityId') entityId: string,
    @Query('classId') classId: string,
    @Query('value') value: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListLabelInstancesResponse> {
    const labels = await this.labelService.listLabelInstances(user, {
      entityType,
      entityId,
      classId,
      value,
      page,
      pageSize,
    });
    return buildSuccessResponse(labels.map((label) => labelPO2DTO(label)));
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/new')
  async createLabelInstance(
    @User() user: UserModel,
    @Body() body: CreateLabelInstanceRequest,
  ): Promise<UpsertLabelInstanceResponse> {
    const label = await this.labelService.createLabelInstance(user, body);
    return buildSuccessResponse(labelPO2DTO(label));
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/update')
  async updateLabelInstance(
    @User() user: UserModel,
    @Body() body: UpdateLabelInstanceRequest,
  ): Promise<UpsertLabelInstanceResponse> {
    const label = await this.labelService.updateLabelInstance(user, body);
    return buildSuccessResponse(labelPO2DTO(label));
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/delete')
  async deleteLabelInstance(
    @User() user: UserModel,
    @Body() body: DeleteLabelInstanceRequest,
  ): Promise<BaseResponse> {
    await this.labelService.deleteLabelInstance(user, body);
    return buildSuccessResponse();
  }
}
