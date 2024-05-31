import _ from 'lodash';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UnauthorizedException,
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
  ResourceListItem,
} from '@refly/openapi-schema';
import { Resource } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '../utils/response';

export const convertResourcePoToListItem = (resource: Resource): ResourceListItem => {
  return {
    ..._.omit(resource, ['id', 'userId', 'deletedAt']),
    createdAt: resource.createdAt.toJSON(),
    updatedAt: resource.updatedAt.toJSON(),
  };
};

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('collection/list')
  async listCollections(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListCollectionResponse> {
    const colls = await this.knowledgeService.listCollections(req.user, { page, pageSize });
    return buildSuccessResponse(
      colls.map((coll) => ({
        ..._.omit(coll, ['id', 'userId', 'deletedAt']),
        createdAt: coll.createdAt.toJSON(),
        updatedAt: coll.updatedAt.toJSON(),
      })),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('collection/detail')
  async showCollectionDetail(
    @Req() req,
    @Query('collectionId') collectionId: string,
  ): Promise<GetCollectionDetailResponse> {
    const coll = await this.knowledgeService.getCollectionDetail(collectionId);
    if (coll.isPublic || coll.userId === req.user.id) {
      return buildSuccessResponse({
        ..._.omit(coll, 'userId'),
        createdAt: coll.createdAt.toJSON(),
        updatedAt: coll.updatedAt.toJSON(),
      });
    }
    return buildSuccessResponse(null);
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/update')
  async updateCollection(
    @Req() req,
    @Body() body: UpsertCollectionRequest,
  ): Promise<UpsertCollectionResponse> {
    if (!body.collectionId) {
      throw new BadRequestException('collectionId is required');
    }
    const collection = await this.knowledgeService.getCollectionDetail(body.collectionId);
    if (collection.userId !== req.user.id) {
      throw new UnauthorizedException();
    }

    const upserted = await this.knowledgeService.upsertCollection(req.user, body);
    return buildSuccessResponse({
      ..._.omit(upserted, ['id', 'userId', 'deletedAt']),
      createdAt: upserted.createdAt.toJSON(),
      updatedAt: upserted.updatedAt.toJSON(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/new')
  async createCollection(
    @Req() req,
    @Body() body: UpsertCollectionRequest,
  ): Promise<UpsertCollectionResponse> {
    if (body.collectionId) {
      throw new BadRequestException('collectionId is not allowed');
    }

    const coll = await this.knowledgeService.upsertCollection(req.user, body);
    return buildSuccessResponse({
      ..._.pick(coll, ['collectionId', 'title', 'description', 'isPublic']),
      createdAt: coll.createdAt.toJSON(),
      updatedAt: coll.updatedAt.toJSON(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/delete')
  async deleteCollection(@Req() req, @Body() body: DeleteCollectionRequest) {
    if (!body.collectionId) {
      throw new BadRequestException('collectionId is required');
    }
    await this.knowledgeService.deleteCollection(req.user, body.collectionId);
    return { data: body };
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/list')
  async listResources(
    @Req() req,
    @Query('collectionId') collectionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListResourceResponse> {
    const resources = await this.knowledgeService.listResources({ collectionId, page, pageSize });
    return buildSuccessResponse(resources.map((r) => convertResourcePoToListItem(r)));
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/detail')
  async showResourceDetail(
    @Req() req,
    @Query('resourceId') resourceId: string,
  ): Promise<GetResourceDetailResponse> {
    const resource = await this.knowledgeService.getResourceDetail(resourceId, true);
    if (resource.isPublic || resource.userId === req.user.id) {
      return buildSuccessResponse(_.omit(resource, 'userId'));
    }
    return buildSuccessResponse(null);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/new')
  async createResource(
    @Req() req,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const resource = await this.knowledgeService.createResource(req.user, body);
    return buildSuccessResponse(convertResourcePoToListItem(resource));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/update')
  async updateResource(
    @Req() req,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    if (!body.resourceId) {
      throw new BadRequestException('Resource ID is required');
    }

    const resource = await this.knowledgeService.getResourceDetail(body.resourceId);
    if (!resource || resource.userId !== req.user.id) {
      throw new BadRequestException('Resource not found');
    }

    const updated = await this.knowledgeService.updateResource(req.user, body);
    return buildSuccessResponse(convertResourcePoToListItem(updated));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/delete')
  async deleteResource(
    @Req() req,
    @Body() body: DeleteResourceRequest,
  ): Promise<DeleteResourceResponse> {
    if (!body.resourceId) {
      throw new BadRequestException('Resource ID is required');
    }
    await this.knowledgeService.deleteResource(req.user, body.resourceId);
    return buildSuccessResponse(null);
  }
}
