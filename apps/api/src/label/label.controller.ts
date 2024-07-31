import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  BaseResponse,
  DeleteLabelInstanceRequest,
  ListLabelClassesResponse,
  ListLabelInstancesResponse,
  UpsertLabelClassRequest,
  UpsertLabelClassResponse,
  UpsertLabelInstanceRequest,
  UpsertLabelInstanceResponse,
} from '@refly/openapi-schema';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '@/utils';

@Controller('label')
export class LabelController {
  @UseGuards(JwtAuthGuard)
  @Get('class/list')
  async listLabelClasses(): Promise<ListLabelClassesResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('class/new')
  async createLabelClass(@Body() body: UpsertLabelClassRequest): Promise<UpsertLabelClassResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('class/update')
  async updateLabelClass(@Body() body: UpsertLabelClassRequest): Promise<UpsertLabelClassResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Get('instance/list')
  async listLabels(): Promise<ListLabelInstancesResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/new')
  async createLabel(@Body() body: UpsertLabelInstanceRequest): Promise<UpsertLabelResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/update')
  async updateLabel(
    @Body() body: UpsertLabelInstanceRequest,
  ): Promise<UpsertLabelInstanceResponse> {
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('instance/delete')
  async deleteLabel(@Body() body: DeleteLabelInstanceRequest): Promise<BaseResponse> {
    return buildSuccessResponse();
  }
}
