import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  UpsertResourceRequest,
  UpsertResourceResponse,
  ListResourceResponse,
  GetResourceDetailResponse,
  DeleteResourceRequest,
  DeleteResourceResponse,
  ResourceType,
  BatchCreateResourceResponse,
  ReindexResourceRequest,
  ReindexResourceResponse,
  QueryReferencesRequest,
  AddReferencesRequest,
  DeleteReferencesRequest,
  ListOrder,
  ListDocumentResponse,
  GetDocumentDetailResponse,
  UpsertDocumentRequest,
  UpsertDocumentResponse,
  DeleteDocumentRequest,
} from '@refly-packages/openapi-schema';
import { User as UserType } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { buildSuccessResponse } from '@/utils';
import { User } from '@/utils/decorators/user.decorator';
import { documentPO2DTO, resourcePO2DTO, referencePO2DTO } from './knowledge.dto';
import { ParamsError } from '@refly-packages/errors';

@Controller('v1/knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('resource/list')
  async listResources(
    @User() user: UserType,
    @Query('projectId') projectId: string,
    @Query('resourceId') resourceId: string,
    @Query('resourceType') resourceType: ResourceType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('order', new DefaultValuePipe('creationDesc')) order: ListOrder,
  ): Promise<ListResourceResponse> {
    const resources = await this.knowledgeService.listResources(user, {
      resourceId,
      resourceType,
      page,
      pageSize,
      order,
    });
    return buildSuccessResponse(resources?.map(resourcePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('resource/detail')
  async showResourceDetail(
    @User() user: UserType,
    @Query('resourceId') resourceId: string,
  ): Promise<GetResourceDetailResponse> {
    const resource = await this.knowledgeService.getResourceDetail(user, { resourceId });
    return buildSuccessResponse(resourcePO2DTO(resource));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/create')
  async createResource(
    @User() user: UserType,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const resource = await this.knowledgeService.createResource(user, body, {
      checkStorageQuota: true,
    });
    return buildSuccessResponse(resourcePO2DTO(resource));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/batchCreate')
  async importResource(
    @User() user: UserType,
    @Body() body: UpsertResourceRequest[],
  ): Promise<BatchCreateResourceResponse> {
    const resources = await this.knowledgeService.batchCreateResource(user, body);
    return buildSuccessResponse(resources.map(resourcePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/update')
  async updateResource(
    @User() user: UserType,
    @Body() body: UpsertResourceRequest,
  ): Promise<UpsertResourceResponse> {
    const { resourceId } = body;
    if (!resourceId) {
      throw new ParamsError('Resource ID is required');
    }

    // Check if the resource exists
    await this.knowledgeService.getResourceDetail(user, { resourceId });

    const updated = await this.knowledgeService.updateResource(user, body);
    return buildSuccessResponse(resourcePO2DTO(updated));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/reindex')
  async reindexResource(
    @User() user: UserType,
    @Body() body: ReindexResourceRequest,
  ): Promise<ReindexResourceResponse> {
    const resources = await this.knowledgeService.reindexResource(user, body);
    return buildSuccessResponse(resources.map(resourcePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('resource/delete')
  async deleteResource(
    @User() user: UserType,
    @Body() body: DeleteResourceRequest,
  ): Promise<DeleteResourceResponse> {
    if (!body.resourceId) {
      throw new ParamsError('Resource ID is required');
    }
    await this.knowledgeService.deleteResource(user, body.resourceId);
    return buildSuccessResponse(null);
  }

  @UseGuards(JwtAuthGuard)
  @Get('document/list')
  async listDocuments(
    @User() user: UserType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('order', new DefaultValuePipe('creationDesc')) order: ListOrder,
  ): Promise<ListDocumentResponse> {
    const documents = await this.knowledgeService.listDocuments(user, {
      page,
      pageSize,
      order,
    });
    return buildSuccessResponse((documents ?? []).map(documentPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('document/detail')
  async getDocumentDetail(
    @User() user: UserType,
    @Query('docId') docId: string,
  ): Promise<GetDocumentDetailResponse> {
    const document = await this.knowledgeService.getDocumentDetail(user, { docId });
    return buildSuccessResponse(documentPO2DTO(document));
  }

  @UseGuards(JwtAuthGuard)
  @Post('document/create')
  async createDocument(
    @User() user: UserType,
    @Body() body: UpsertDocumentRequest,
  ): Promise<UpsertDocumentResponse> {
    const document = await this.knowledgeService.createDocument(user, body);
    return buildSuccessResponse(documentPO2DTO(document));
  }

  @UseGuards(JwtAuthGuard)
  @Post('document/update')
  async updateDocument(
    @User() user: UserType,
    @Body() body: UpsertDocumentRequest,
  ): Promise<UpsertDocumentResponse> {
    if (!body.docId) {
      throw new ParamsError('Document ID is required');
    }
    const documents = await this.knowledgeService.batchUpdateDocument(user, [body]);
    return buildSuccessResponse(documentPO2DTO(documents?.[0]));
  }

  @UseGuards(JwtAuthGuard)
  @Post('document/batchUpdate')
  async batchUpdateDocument(@User() user: UserType, @Body() body: UpsertDocumentRequest[]) {
    await this.knowledgeService.batchUpdateDocument(user, body);
    return buildSuccessResponse({});
  }

  @UseGuards(JwtAuthGuard)
  @Post('document/delete')
  async deleteDocument(@User() user: UserType, @Body() body: DeleteDocumentRequest) {
    if (!body.docId) {
      throw new ParamsError('Document ID is required');
    }
    await this.knowledgeService.deleteDocument(user, body);
    return buildSuccessResponse({});
  }

  @UseGuards(JwtAuthGuard)
  @Post('reference/query')
  async queryReferences(@User() user: UserType, @Body() body: QueryReferencesRequest) {
    const references = await this.knowledgeService.queryReferences(user, body);
    return buildSuccessResponse(references.map(referencePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('reference/add')
  async addReferences(@User() user: UserType, @Body() body: AddReferencesRequest) {
    const references = await this.knowledgeService.addReferences(user, body);
    return buildSuccessResponse(references.map(referencePO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Post('reference/delete')
  async deleteReferences(@User() user: UserType, @Body() body: DeleteReferencesRequest) {
    await this.knowledgeService.deleteReferences(user, body);
    return buildSuccessResponse({});
  }
}
