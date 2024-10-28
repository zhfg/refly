import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import {
  UpsertProjectRequest,
  UpsertProjectResponse,
  UpsertResourceRequest,
  UpsertResourceResponse,
  GetProjectDetailResponse,
  ListProjectResponse,
  ListResourceResponse,
  GetResourceDetailResponse,
  DeleteProjectRequest,
  DeleteResourceRequest,
  DeleteResourceResponse,
  ListCanvasResponse,
  GetCanvasDetailResponse,
  UpsertCanvasResponse,
  UpsertCanvasRequest,
  DeleteCanvasRequest,
  ResourceType,
  BatchCreateResourceResponse,
  ReindexResourceRequest,
  ReindexResourceResponse,
  BindProjectResourcesRequest,
  QueryReferencesRequest,
  AddReferencesRequest,
  DeleteReferencesRequest,
} from '@refly-packages/openapi-schema';
import { User as UserModel } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '@/utils';
import { User } from '@/utils/decorators/user.decorator';
import { canvasPO2DTO, resourcePO2DTO, projectPO2DTO, referencePO2DTO } from './knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('project/list')
  async listProjects(
    @User() user: UserModel,
    @Query('projectId') projectId: string,
    @Query('resourceId') resourceId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListProjectResponse> {
    const projects = await this.knowledgeService.listProjects(user, {
      projectId,
      resourceId,
      page,
      pageSize,
    });
    return buildSuccessResponse(projects.map(projectPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/detail')
  async getProjectDetail(
    @User() user: UserModel,
    @Query('projectId') projectId: string,
  ): Promise<GetProjectDetailResponse> {
    const project = await this.knowledgeService.getProjectDetail(user, { projectId });
    return buildSuccessResponse(projectPO2DTO(project));
  }

  @UseGuards(JwtAuthGuard)
  @Post('project/update')
  async updateProject(
    @User() user: UserModel,
    @Body() body: UpsertProjectRequest,
  ): Promise<UpsertProjectResponse> {
    const { projectId } = body;
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    const project = await this.knowledgeService.getProjectDetail(user, { projectId });
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const upserted = await this.knowledgeService.upsertProject(user, body);
    return buildSuccessResponse(projectPO2DTO(upserted));
  }

  @UseGuards(JwtAuthGuard)
  @Post('project/new')
  async createProject(
    @User() user: UserModel,
    @Body() body: UpsertProjectRequest,
  ): Promise<UpsertProjectResponse> {
    if (body.projectId) {
      throw new BadRequestException('projectId is not allowed');
    }
    const project = await this.knowledgeService.upsertProject(user, body);
    return buildSuccessResponse(projectPO2DTO(project));
  }

  @UseGuards(JwtAuthGuard)
  @Post('project/delete')
  async deleteProject(@User() user: UserModel, @Body() body: DeleteProjectRequest) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }
    await this.knowledgeService.deleteProject(user, body.projectId);
    return { data: body };
  }

  @UseGuards(JwtAuthGuard)
  @Post('project/bindRes')
  async bindProjectResources(@User() user: UserModel, @Body() body: BindProjectResourcesRequest) {
    await this.knowledgeService.bindProjectResources(user, body);
    return buildSuccessResponse({});
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/list')
  async listResources(
    @User() user: UserModel,
    @Query('projectId') projectId: string,
    @Query('resourceId') resourceId: string,
    @Query('resourceType') resourceType: ResourceType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListResourceResponse> {
    const resources = await this.knowledgeService.listResources(user, {
      projectId,
      resourceId,
      resourceType,
      page,
      pageSize,
    });
    return buildSuccessResponse(resources.map(resourcePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/detail')
  async showResourceDetail(
    @User() user: UserModel,
    @Query('resourceId') resourceId: string,
  ): Promise<GetResourceDetailResponse> {
    const resource = await this.knowledgeService.getResourceDetail(user, { resourceId });
    return buildSuccessResponse(resourcePO2DTO(resource));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/new')
  async createResource(
    @User() user: UserModel,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const resource = await this.knowledgeService.createResource(user, body, {
      checkStorageQuota: true,
    });
    return buildSuccessResponse(resourcePO2DTO(resource));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/batch')
  async importResource(
    @User() user: UserModel,
    @Body() body: UpsertResourceRequest[],
  ): Promise<BatchCreateResourceResponse> {
    const resources = await this.knowledgeService.batchCreateResource(user, body);
    return buildSuccessResponse(resources.map(resourcePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/update')
  async updateResource(
    @User() user: UserModel,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const { resourceId } = body;
    if (!resourceId) {
      throw new BadRequestException('Resource ID is required');
    }

    await this.knowledgeService.getResourceDetail(user, { resourceId });

    const updated = await this.knowledgeService.updateResource(user, body);
    return buildSuccessResponse(resourcePO2DTO(updated));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/reindex')
  async reindexResource(
    @User() user: UserModel,
    @Body() body: ReindexResourceRequest,
  ): Promise<ReindexResourceResponse> {
    const resources = await this.knowledgeService.reindexResource(user, body);
    return buildSuccessResponse(resources.map(resourcePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/delete')
  async deleteResource(
    @User() user: UserModel,
    @Body() body: DeleteResourceRequest,
  ): Promise<DeleteResourceResponse> {
    if (!body.resourceId) {
      throw new BadRequestException('Resource ID is required');
    }
    await this.knowledgeService.deleteResource(user, body.resourceId);
    return buildSuccessResponse(null);
  }

  @UseGuards(JwtAuthGuard)
  @Get('canvas/list')
  async listCanvases(
    @User() user: UserModel,
    @Query('projectId') projectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListCanvasResponse> {
    const canvases = await this.knowledgeService.listCanvases(user, { projectId, page, pageSize });
    return buildSuccessResponse(canvases.map(canvasPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('canvas/detail')
  async getCanvasDetail(
    @User() user: UserModel,
    @Query('canvasId') canvasId: string,
  ): Promise<GetCanvasDetailResponse> {
    const canvas = await this.knowledgeService.getCanvasDetail(user, canvasId);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('canvas/new')
  async createCanvas(
    @User() user: UserModel,
    @Body() body: UpsertCanvasRequest,
  ): Promise<UpsertCanvasResponse> {
    const canvas = await this.knowledgeService.upsertCanvas(user, body);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('canvas/update')
  async updateCanvas(@User() user: UserModel, @Body() body: UpsertCanvasRequest) {
    if (!body.canvasId) {
      throw new BadRequestException('Canvas ID is required');
    }
    const canvas = await this.knowledgeService.upsertCanvas(user, body);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('canvas/delete')
  async deleteCanvas(@User() user: UserModel, @Body() body: DeleteCanvasRequest) {
    if (!body.canvasId) {
      throw new BadRequestException('Canvas ID is required');
    }
    await this.knowledgeService.deleteCanvas(user, body.canvasId);
    return buildSuccessResponse({});
  }

  @UseGuards(JwtAuthGuard)
  @Post('reference/query')
  async queryReferences(@User() user: UserModel, @Body() body: QueryReferencesRequest) {
    const references = await this.knowledgeService.queryReferences(user, body);
    return buildSuccessResponse(references.map(referencePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('reference/add')
  async addReferences(@User() user: UserModel, @Body() body: AddReferencesRequest) {
    const references = await this.knowledgeService.addReferences(user, body);
    return buildSuccessResponse(references.map(referencePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('reference/delete')
  async deleteReferences(@User() user: UserModel, @Body() body: DeleteReferencesRequest) {
    await this.knowledgeService.deleteReferences(user, body);
    return buildSuccessResponse({});
  }
}
