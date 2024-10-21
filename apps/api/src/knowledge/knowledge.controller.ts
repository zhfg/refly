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
  UpsertCollectionRequest,
  UpsertCollectionResponse,
  UpsertResourceRequest,
  UpsertResourceResponse,
  GetCollectionDetailResponse,
  ListCollectionResponse,
  ListResourceResponse,
  GetResourceDetailResponse,
  DeleteCollectionRequest,
  DeleteResourceRequest,
  DeleteResourceResponse,
  ListCanvasResponse,
  GetCanvasDetailResponse,
  UpsertCanvasResponse,
  UpsertCanvasRequest,
  DeleteCanvasRequest,
  ResourceType,
  BatchCreateResourceResponse,
  AddResourceToCollectionRequest,
  RemoveResourceFromCollectionRequest,
  ReindexResourceRequest,
  ReindexResourceResponse,
} from '@refly-packages/openapi-schema';
import { User as UserModel } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '@/utils';
import { User } from '@/utils/decorators/user.decorator';
import { collectionPO2DTO, canvasPO2DTO, resourcePO2DTO } from './knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('collection/list')
  async listCollections(
    @User() user: UserModel,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListCollectionResponse> {
    const colls = await this.knowledgeService.listCollections(user, { page, pageSize });
    return buildSuccessResponse(colls.map(collectionPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('collection/detail')
  async getCollectionDetail(
    @User() user: UserModel,
    @Query('collectionId') collectionId: string,
  ): Promise<GetCollectionDetailResponse> {
    const coll = await this.knowledgeService.getCollectionDetail(user, { collectionId });
    return buildSuccessResponse(collectionPO2DTO(coll));
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/update')
  async updateCollection(
    @User() user: UserModel,
    @Body() body: UpsertCollectionRequest,
  ): Promise<UpsertCollectionResponse> {
    const { collectionId } = body;
    if (!collectionId) {
      throw new BadRequestException('collectionId is required');
    }
    const collection = await this.knowledgeService.getCollectionDetail(user, { collectionId });
    if (!collection) {
      throw new BadRequestException('Collection not found');
    }

    const upserted = await this.knowledgeService.upsertCollection(user, body);
    return buildSuccessResponse(collectionPO2DTO(upserted));
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/new')
  async createCollection(
    @User() user: UserModel,
    @Body() body: UpsertCollectionRequest,
  ): Promise<UpsertCollectionResponse> {
    if (body.collectionId) {
      throw new BadRequestException('collectionId is not allowed');
    }
    const coll = await this.knowledgeService.upsertCollection(user, body);
    return buildSuccessResponse(collectionPO2DTO(coll));
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/addResource')
  async addResourceToCollection(
    @User() user: UserModel,
    @Body() body: AddResourceToCollectionRequest,
  ) {
    await this.knowledgeService.addResourceToCollection(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/removeResource')
  async removeResourceFromCollection(
    @User() user: UserModel,
    @Body() body: RemoveResourceFromCollectionRequest,
  ) {
    await this.knowledgeService.removeResourceFromCollection(user, body);
    return buildSuccessResponse();
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/delete')
  async deleteCollection(@User() user: UserModel, @Body() body: DeleteCollectionRequest) {
    if (!body.collectionId) {
      throw new BadRequestException('collectionId is required');
    }
    await this.knowledgeService.deleteCollection(user, body.collectionId);
    return { data: body };
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/list')
  async listResources(
    @User() user: UserModel,
    @Query('resourceId') resourceId: string,
    @Query('resourceType') resourceType: ResourceType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListResourceResponse> {
    const resources = await this.knowledgeService.listResources(user, {
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListCanvasResponse> {
    const canvases = await this.knowledgeService.listCanvas(user, { page, pageSize });
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
}
