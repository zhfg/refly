import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import {
  CreateCollectionParam,
  CreateCollectionResponse,
  CreateResourceParam,
  CreateResourceResponse,
  GetCollectionDetailResponse,
  ListCollectionResponse,
  ListResourceResponse,
  QueryResourceParam,
} from './knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('collection/list')
  @ApiResponse({ type: ListCollectionResponse })
  async listCollections(@Req() req): Promise<ListCollectionResponse> {
    return {
      data: await this.knowledgeService.listCollections(req.user),
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
    return { data: coll };
  }

  @UseGuards(JwtAuthGuard)
  @Post('collection/new')
  @ApiResponse({ type: CreateCollectionResponse })
  async createCollection(@Req() req, @Body() body: CreateCollectionParam) {
    return { data: this.knowledgeService.createCollection(req.user, body) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/list')
  @ApiResponse({ type: ListResourceResponse })
  async listResources(
    @Req() req,
    @Query('collectionId') collectionId: string,
  ): Promise<ListResourceResponse> {
    const param: QueryResourceParam = { collectionId };
    return { data: await this.knowledgeService.listResources(param) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/detail')
  @ApiResponse({ type: GetCollectionDetailResponse })
  async showResourceDetail(@Req() req, @Query('resourceId') resourceId: string) {
    return { data: await this.knowledgeService.getResourceDetail(resourceId) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/new')
  @ApiResponse({ type: CreateResourceResponse })
  async createResource(@Req() req, @Body() body: CreateResourceParam) {
    return this.knowledgeService.createResource(req.user, body);
  }
}
