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
import { ApiResponse } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
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
  convertResourcePoToListItem,
  CollectionListItem,
} from './knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('collection/list')
  @ApiResponse({ type: ListCollectionResponse })
  async listCollections(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListCollectionResponse> {
    const colls = await this.knowledgeService.listCollections(req.user, { page, pageSize });
    return {
      data: colls.map((coll) => _.omit(coll, ['id', 'userId', 'deletedAt']) as CollectionListItem),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('collection/detail')
  @ApiResponse({ type: GetCollectionDetailResponse })
  async showCollectionDetail(
    @Req() req,
    @Query('collectionId') collectionId: string,
  ): Promise<GetCollectionDetailResponse> {
    const coll = await this.knowledgeService.getCollectionDetail(collectionId);
    if (coll.isPublic || coll.userId === req.user.id) {
      return { data: _.omit(coll, 'userId') };
    }
    return { data: null };
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/update')
  @ApiResponse({ type: UpsertCollectionResponse })
  async updateCollection(@Req() req, @Body() body: UpsertCollectionRequest) {
    if (!body.collectionId) {
      throw new BadRequestException('collectionId is required');
    }
    const collection = await this.knowledgeService.getCollectionDetail(body.collectionId);
    if (collection.userId !== req.user.id) {
      throw new UnauthorizedException();
    }

    return { data: await this.knowledgeService.upsertCollection(req.user, body) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/new')
  @ApiResponse({ type: UpsertCollectionResponse })
  async createCollection(@Req() req, @Body() body: UpsertCollectionRequest) {
    if (body.collectionId) {
      throw new BadRequestException('collectionId is not allowed');
    }

    return { data: await this.knowledgeService.upsertCollection(req.user, body) };
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
  @ApiResponse({ type: ListResourceResponse })
  async listResources(
    @Req() req,
    @Query('collectionId') collectionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListResourceResponse> {
    const resources = await this.knowledgeService.listResources({ collectionId, page, pageSize });
    return {
      data: resources.map((r) => convertResourcePoToListItem(r)),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/detail')
  @ApiResponse({ type: GetResourceDetailResponse })
  async showResourceDetail(
    @Req() req,
    @Query('resourceId') resourceId: string,
  ): Promise<GetResourceDetailResponse> {
    const resource = await this.knowledgeService.getResourceDetail(resourceId, true);
    if (resource.isPublic || resource.userId === req.user.id) {
      return { data: _.omit(resource, 'userId') };
    }
    return { data: null };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/new')
  @ApiResponse({ type: UpsertResourceResponse })
  async createResource(
    @Req() req,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const resource = await this.knowledgeService.createResource(req.user, body);
    return { data: convertResourcePoToListItem(resource) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/update')
  @ApiResponse({ type: UpsertResourceResponse })
  async updateResource(@Req() req, @Body() body: UpsertResourceRequest) {
    if (!body.resourceId) {
      throw new BadRequestException('Resource ID is required');
    }

    const resource = await this.knowledgeService.getResourceDetail(body.resourceId);
    if (!resource || resource.userId !== req.user.id) {
      throw new BadRequestException('Resource not found');
    }

    const updated = await this.knowledgeService.updateResource(req.user, body);
    return { data: convertResourcePoToListItem(updated) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/delete')
  async deleteResource(@Req() req, @Body() body: DeleteResourceRequest) {
    if (!body.resourceId) {
      throw new BadRequestException('Resource ID is required');
    }
    await this.knowledgeService.deleteResource(req.user, body.resourceId);
    return { data: body };
  }
}
