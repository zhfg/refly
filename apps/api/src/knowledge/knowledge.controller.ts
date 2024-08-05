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
  ListNoteResponse,
  GetNoteDetailResponse,
  UpsertNoteResponse,
  UpsertNoteRequest,
  DeleteNoteRequest,
  BatchCreateResourceResponse,
} from '@refly/openapi-schema';
import { ResourceType, User as UserModel } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '../utils';
import { User } from 'src/utils/decorators/user.decorator';
import { collectionPO2DTO, notePO2DTO, resourcePO2DTO } from './knowledge.dto';

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
    return buildSuccessResponse(colls.map((coll) => collectionPO2DTO(coll)));
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
    @Query('collectionId') collectionId: string,
    @Query('resourceType') resourceType: ResourceType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListResourceResponse> {
    const resources = await this.knowledgeService.listResources(user, {
      collectionId,
      resourceType,
      page,
      pageSize,
    });
    return buildSuccessResponse(resources.map((r) => resourcePO2DTO(r)));
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/detail')
  async showResourceDetail(
    @User() user: UserModel,
    @Query('resourceId') resourceId: string,
  ): Promise<GetResourceDetailResponse> {
    const resource = await this.knowledgeService.getResourceDetail(user, { resourceId });
    return buildSuccessResponse(resourcePO2DTO(resource, true));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/new')
  async createResource(
    @User() user: UserModel,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const resource = await this.knowledgeService.createResource(user, body);
    return buildSuccessResponse(resourcePO2DTO(resource));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/batch')
  async importResource(
    @User() user: UserModel,
    @Body() body: UpsertResourceRequest[],
  ): Promise<BatchCreateResourceResponse> {
    const resources = await this.knowledgeService.batchCreateResource(user, body);
    return buildSuccessResponse(resources.map((r) => resourcePO2DTO(r)));
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

    const resource = await this.knowledgeService.getResourceDetail(user, { resourceId });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    const updated = await this.knowledgeService.updateResource(user, body);
    return buildSuccessResponse(resourcePO2DTO(updated));
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
  @Get('note/list')
  async listNotes(
    @User() user: UserModel,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<ListNoteResponse> {
    const notes = await this.knowledgeService.listNotes(user, { page, pageSize });
    return buildSuccessResponse(notes.map((note) => notePO2DTO(note)));
  }

  @UseGuards(JwtAuthGuard)
  @Get('note/detail')
  async showNoteDetail(
    @User() user: UserModel,
    @Query('noteId') noteId: string,
  ): Promise<GetNoteDetailResponse> {
    const note = await this.knowledgeService.getNoteDetail(user, noteId);
    return buildSuccessResponse(notePO2DTO(note, true));
  }

  @UseGuards(JwtAuthGuard)
  @Post('note/new')
  async createNote(
    @User() user: UserModel,
    @Body() body: UpsertNoteRequest,
  ): Promise<UpsertNoteResponse> {
    const note = await this.knowledgeService.upsertNote(user, body);
    return buildSuccessResponse(notePO2DTO(note));
  }

  @UseGuards(JwtAuthGuard)
  @Post('note/update')
  async updateNote(@User() user: UserModel, @Body() body: UpsertNoteRequest) {
    if (!body.noteId) {
      throw new BadRequestException('Note ID is required');
    }
    const note = await this.knowledgeService.upsertNote(user, body);
    return buildSuccessResponse(notePO2DTO(note));
  }

  @UseGuards(JwtAuthGuard)
  @Post('note/delete')
  async deleteNote(@User() user: UserModel, @Body() body: DeleteNoteRequest) {
    if (!body.noteId) {
      throw new BadRequestException('Note ID is required');
    }
    await this.knowledgeService.deleteNote(user, body.noteId);
    return buildSuccessResponse({});
  }
}
