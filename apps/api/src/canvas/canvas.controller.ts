import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { CanvasService } from './canvas.service';
import { LoginedUser } from '@/utils/decorators/user.decorator';
import {
  canvasPO2DTO,
  canvasTemplateCategoryPO2DTO,
  canvasTemplatePO2DTO,
} from '@/canvas/canvas.dto';
import { buildSuccessResponse } from '@/utils';
import {
  User,
  UpsertCanvasRequest,
  DeleteCanvasRequest,
  AutoNameCanvasRequest,
  AutoNameCanvasResponse,
  DuplicateCanvasRequest,
  CreateCanvasTemplateRequest,
  UpdateCanvasTemplateRequest,
} from '@refly-packages/openapi-schema';

@Controller('v1/canvas')
export class CanvasController {
  constructor(private canvasService: CanvasService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listCanvases(
    @LoginedUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    const canvases = await this.canvasService.listCanvases(user, { page, pageSize });
    return buildSuccessResponse(canvases.map(canvasPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail')
  async getCanvasDetail(@LoginedUser() user: User, @Query('canvasId') canvasId: string) {
    const canvas = await this.canvasService.getCanvasDetail(user, canvasId);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Get('data')
  async getCanvasData(@LoginedUser() user: User, @Query('canvasId') canvasId: string) {
    const data = await this.canvasService.getCanvasRawData(user, canvasId);
    return buildSuccessResponse(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('duplicate')
  async duplicateCanvas(@LoginedUser() user: User, @Body() body: DuplicateCanvasRequest) {
    const canvas = await this.canvasService.duplicateCanvas(user, body, { checkOwnership: true });
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createCanvas(@LoginedUser() user: User, @Body() body: UpsertCanvasRequest) {
    const canvas = await this.canvasService.createCanvas(user, body);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('update')
  async updateCanvas(@LoginedUser() user: User, @Body() body: UpsertCanvasRequest) {
    const canvas = await this.canvasService.updateCanvas(user, body);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete')
  async deleteCanvas(@LoginedUser() user: User, @Body() body: DeleteCanvasRequest) {
    await this.canvasService.deleteCanvas(user, body);
    return buildSuccessResponse({});
  }

  @UseGuards(JwtAuthGuard)
  @Post('autoName')
  async autoNameCanvas(
    @LoginedUser() user: User,
    @Body() body: AutoNameCanvasRequest,
  ): Promise<AutoNameCanvasResponse> {
    const data = await this.canvasService.autoNameCanvas(user, body);
    return buildSuccessResponse(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('template/list')
  async listCanvasTemplates(
    @LoginedUser() user: User,
    @Query('categoryId') categoryId: string,
    @Query('scope', new DefaultValuePipe('public')) scope: 'public' | 'private',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    const templates = await this.canvasService.listCanvasTemplates(user, {
      page,
      pageSize,
      scope,
      categoryId,
    });
    return buildSuccessResponse(templates.map(canvasTemplatePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('template/create')
  async createCanvasTemplate(@LoginedUser() user: User, @Body() body: CreateCanvasTemplateRequest) {
    const template = await this.canvasService.createCanvasTemplate(user, body);
    return buildSuccessResponse(canvasTemplatePO2DTO(template));
  }

  @UseGuards(JwtAuthGuard)
  @Post('template/update')
  async updateCanvasTemplate(@LoginedUser() user: User, @Body() body: UpdateCanvasTemplateRequest) {
    const template = await this.canvasService.updateCanvasTemplate(user, body);
    return buildSuccessResponse(canvasTemplatePO2DTO(template));
  }

  @UseGuards(JwtAuthGuard)
  @Get('template/category/list')
  async listCanvasTemplateCategories() {
    const categories = await this.canvasService.listCanvasTemplateCategories();
    return buildSuccessResponse(categories.map(canvasTemplateCategoryPO2DTO));
  }
}
