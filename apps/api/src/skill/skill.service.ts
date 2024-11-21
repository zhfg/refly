import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import pLimit from 'p-limit';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  Prisma,
  SkillTrigger as SkillTriggerModel,
  ChatMessage as ChatMessageModel,
  Conversation as ConversationModel,
  SkillJob as SkillJobModel,
} from '@prisma/client';
import { Response } from 'express';
import { AIMessageChunk, BaseMessage } from '@langchain/core/dist/messages';
import {
  CreateSkillInstanceRequest,
  CreateSkillTriggerRequest,
  DeleteSkillInstanceRequest,
  DeleteSkillTriggerRequest,
  InvokeSkillRequest,
  ListSkillInstancesData,
  ListSkillJobsData,
  ListSkillTriggersData,
  PinSkillInstanceRequest,
  Resource,
  SkillContext,
  SkillMeta,
  Skill,
  SkillTriggerCreateParam,
  TimerInterval,
  TimerTriggerConfig,
  UnpinSkillInstanceRequest,
  UpdateSkillInstanceRequest,
  UpdateSkillTriggerRequest,
  User,
  Project,
  Document,
} from '@refly-packages/openapi-schema';
import {
  BaseSkill,
  ReflyService,
  SkillEngine,
  SkillEventMap,
  SkillRunnableConfig,
  SkillRunnableMeta,
  createSkillInventory,
} from '@refly-packages/skill-template';
import {
  detectLanguage,
  genSkillID,
  genSkillJobID,
  genSkillTriggerID,
} from '@refly-packages/utils';
import { PrismaService } from '@/common/prisma.service';
import {
  CHANNEL_INVOKE_SKILL,
  QUEUE_SKILL,
  buildSuccessResponse,
  writeSSEResponse,
  pick,
  QUEUE_SYNC_TOKEN_USAGE,
  omit,
} from '@/utils';
import { InvokeSkillJobData, skillInstancePO2DTO } from './skill.dto';
import { KnowledgeService } from '@/knowledge/knowledge.service';
import {
  projectPO2DTO,
  documentPO2DTO,
  resourcePO2DTO,
  referencePO2DTO,
} from '@/knowledge/knowledge.dto';
import { ConversationService } from '@/conversation/conversation.service';
import { MessageAggregator } from '@/utils/message';
import { CanvasIntentType, SkillEvent } from '@refly-packages/common-types';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '@/search/search.service';
import { RAGService } from '@/rag/rag.service';
import { LabelService } from '@/label/label.service';
import { labelClassPO2DTO, labelPO2DTO } from '@/label/label.dto';
import { SyncTokenUsageJobData } from '@/subscription/subscription.dto';
import { SubscriptionService } from '@/subscription/subscription.service';
import { ElasticsearchService } from '@/common/elasticsearch.service';
import {
  ConversationNotFoundError,
  ModelNotSupportedError,
  ModelUsageQuotaExceeded,
  ParamsError,
  ProjectNotFoundError,
  SkillNotFoundError,
} from '@refly-packages/errors';
import { genBaseRespDataFromError } from '@/utils/exception';
import { CanvasService } from '@/canvas/canvas.service';
import { canvasPO2DTO } from '@/canvas/canvas.dto';

export function createLangchainMessage(message: ChatMessageModel): BaseMessage {
  const messageData = {
    content: message.content,
    additional_kwargs: {
      logs: JSON.parse(message.logs),
      skillMeta: JSON.parse(message.skillMeta),
      structuredData: JSON.parse(message.structuredData),
      type: message.type,
    },
  };

  switch (message.type) {
    case 'ai':
      return new AIMessage(messageData);
    case 'human':
      return new HumanMessage(messageData);
    case 'system':
      return new SystemMessage(messageData);
    default:
      throw new Error(`invalid message source: ${message.type}`);
  }
}

function validateSkillTriggerCreateParam(param: SkillTriggerCreateParam) {
  if (param.triggerType === 'simpleEvent') {
    if (!param.simpleEventName) {
      throw new ParamsError('invalid event trigger config');
    }
  } else if (param.triggerType === 'timer') {
    if (!param.timerConfig) {
      throw new ParamsError('invalid timer trigger config');
    }
  }
}

@Injectable()
export class SkillService {
  private logger = new Logger(SkillService.name);
  private skillEngine: SkillEngine;
  private skillInventory: BaseSkill[];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private elasticsearch: ElasticsearchService,
    private label: LabelService,
    private search: SearchService,
    private knowledge: KnowledgeService,
    private rag: RAGService,
    private canvas: CanvasService,
    private conversation: ConversationService,
    private subscription: SubscriptionService,
    @InjectQueue(QUEUE_SKILL) private skillQueue: Queue<InvokeSkillJobData>,
    @InjectQueue(QUEUE_SYNC_TOKEN_USAGE) private usageReportQueue: Queue<SyncTokenUsageJobData>,
  ) {
    this.skillEngine = new SkillEngine(this.logger, this.buildReflyService(), {
      defaultModel: this.config.get('skill.defaultModel'),
    });
    this.skillInventory = createSkillInventory(this.skillEngine);
  }

  buildReflyService = (): ReflyService => {
    return {
      createCanvas: async (user, req) => {
        const canvas = await this.canvas.createCanvas(user, req);
        return buildSuccessResponse(canvasPO2DTO(canvas));
      },
      listCanvases: async (user, param) => {
        const canvasList = await this.canvas.listCanvases(user, param);
        return buildSuccessResponse(canvasList.map((canvas) => canvasPO2DTO(canvas)));
      },
      deleteCanvas: async (user, param) => {
        await this.canvas.deleteCanvas(user, param);
        return buildSuccessResponse({});
      },
      getDocumentDetail: async (user, param) => {
        const canvas = await this.knowledge.getDocumentDetail(user, param);
        return buildSuccessResponse(documentPO2DTO(canvas));
      },
      createDocument: async (user, req) => {
        const canvas = await this.knowledge.createDocument(user, req);
        return buildSuccessResponse(documentPO2DTO(canvas));
      },
      listDocuments: async (user, param) => {
        const canvasList = await this.knowledge.listDocuments(user, param);
        return buildSuccessResponse(canvasList.map((canvas) => documentPO2DTO(canvas)));
      },
      deleteDocument: async (user, param) => {
        await this.knowledge.deleteDocument(user, param);
        return buildSuccessResponse({});
      },
      getResourceDetail: async (user, req) => {
        const resource = await this.knowledge.getResourceDetail(user, req);
        return buildSuccessResponse(resourcePO2DTO(resource));
      },
      createResource: async (user, req) => {
        const resource = await this.knowledge.createResource(user, req);
        return buildSuccessResponse(resourcePO2DTO(resource));
      },
      batchCreateResource: async (user, req) => {
        const resources = await this.knowledge.batchCreateResource(user, req);
        return buildSuccessResponse(resources.map(resourcePO2DTO));
      },
      updateResource: async (user, req) => {
        const resource = await this.knowledge.updateResource(user, req);
        return buildSuccessResponse(resourcePO2DTO(resource));
      },
      createProject: async (user, req) => {
        const project = await this.knowledge.upsertProject(user, req);
        return buildSuccessResponse(projectPO2DTO(project));
      },
      updateProject: async (user, req) => {
        const project = await this.knowledge.upsertProject(user, req);
        return buildSuccessResponse(projectPO2DTO(project));
      },
      getProjectDetail: async (user, req) => {
        const project = await this.knowledge.getProjectDetail(user, req);
        return buildSuccessResponse(projectPO2DTO(project));
      },
      createLabelClass: async (user, req) => {
        const labelClass = await this.label.createLabelClass(user, req);
        return buildSuccessResponse(labelClassPO2DTO(labelClass));
      },
      createLabelInstance: async (user, req) => {
        const labels = await this.label.createLabelInstance(user, req);
        return buildSuccessResponse(labels.map((label) => labelPO2DTO(label)));
      },
      webSearch: async (user, req) => {
        const result = await this.search.webSearch(user, req);
        return buildSuccessResponse(result);
      },
      rerank: async (query, results, options) => {
        const result = await this.rag.rerank(query, results, options);
        return buildSuccessResponse(result);
      },
      search: async (user, req, options) => {
        const result = await this.search.search(user, req, options);
        return buildSuccessResponse(result);
      },
      addReferences: async (user, req) => {
        const references = await this.knowledge.addReferences(user, req);
        return buildSuccessResponse(references.map(referencePO2DTO));
      },
      deleteReferences: async (user, req) => {
        await this.knowledge.deleteReferences(user, req);
        return buildSuccessResponse({});
      },
      inMemorySearchWithIndexing: async (user, options) => {
        const result = await this.rag.inMemorySearchWithIndexing(user, options);
        return buildSuccessResponse(result);
      },
    };
  };

  listSkills(user: User): Skill[] {
    const locale = user.uiLocale || 'en';
    const skills = this.skillInventory.map((skill) => ({
      name: skill.name,
      displayName: skill.displayName[locale],
      icon: skill.icon,
      description: skill.description,
      configSchema: skill.configSchema,
    }));

    return skills;
  }

  async listSkillInstances(user: User, param: ListSkillInstancesData['query']) {
    const { skillId, sortByPin, page, pageSize } = param;

    const orderBy: Prisma.SkillInstanceOrderByWithRelationInput[] = [{ updatedAt: 'desc' }];
    if (sortByPin) {
      orderBy.unshift({ pinnedAt: { sort: 'desc', nulls: 'last' } });
    }

    return this.prisma.skillInstance.findMany({
      where: { skillId, uid: user.uid, deletedAt: null },
      orderBy,
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async createSkillInstance(user: User, param: CreateSkillInstanceRequest) {
    const { uid } = user;
    const { instanceList } = param;
    const tplConfigMap = new Map<string, BaseSkill>();

    instanceList.forEach((instance) => {
      if (!instance.displayName) {
        throw new ParamsError('skill display name is required');
      }
      const tpl = this.skillInventory.find((tpl) => tpl.name === instance.tplName);
      if (!tpl) {
        throw new ParamsError(`skill ${instance.tplName} not found`);
      }
      tplConfigMap.set(instance.tplName, tpl);
    });

    const instances = await this.prisma.skillInstance.createManyAndReturn({
      data: instanceList.map((instance) => ({
        skillId: genSkillID(),
        uid,
        ...pick(instance, ['tplName', 'displayName', 'description']),
        icon: JSON.stringify(instance.icon ?? tplConfigMap.get(instance.tplName)?.icon),
        ...{
          tplConfig: instance.tplConfig ? JSON.stringify(instance.tplConfig) : undefined,
          configSchema: tplConfigMap.get(instance.tplName)?.configSchema
            ? JSON.stringify(tplConfigMap.get(instance.tplName)?.configSchema)
            : undefined,
          invocationConfig: tplConfigMap.get(instance.tplName)?.invocationConfig
            ? JSON.stringify(tplConfigMap.get(instance.tplName)?.invocationConfig)
            : undefined,
        },
      })),
    });

    await Promise.all(
      instances.map((instance) => {
        this.elasticsearch.upsertSkill({
          id: instance.skillId,
          createdAt: instance.createdAt.toJSON(),
          updatedAt: instance.updatedAt.toJSON(),
          ...pick(instance, ['uid', 'tplName', 'displayName', 'description']),
        });
      }),
    );

    return instances;
  }

  async updateSkillInstance(user: User, param: UpdateSkillInstanceRequest) {
    const { uid } = user;
    const { skillId } = param;

    if (!skillId) {
      throw new ParamsError('skill id is required');
    }

    return this.prisma.skillInstance.update({
      where: { skillId, uid, deletedAt: null },
      data: {
        ...pick(param, ['displayName', 'description']),
        tplConfig: param.tplConfig ? JSON.stringify(param.tplConfig) : undefined,
      },
    });
  }

  async pinSkillInstance(user: User, param: PinSkillInstanceRequest) {
    const { uid } = user;
    const { skillId } = param;

    if (!skillId) {
      throw new ParamsError('skill id is required');
    }

    return this.prisma.skillInstance.update({
      where: { skillId, uid, deletedAt: null },
      data: { pinnedAt: new Date() },
    });
  }

  async unpinSkillInstance(user: User, param: UnpinSkillInstanceRequest) {
    const { uid } = user;
    const { skillId } = param;

    if (!skillId) {
      throw new ParamsError('skill id is required');
    }

    return this.prisma.skillInstance.update({
      where: { skillId, uid, deletedAt: null },
      data: { pinnedAt: null },
    });
  }

  async deleteSkillInstance(user: User, param: DeleteSkillInstanceRequest) {
    const { skillId } = param;
    if (!skillId) {
      throw new ParamsError('skill id is required');
    }
    const skill = await this.prisma.skillInstance.findUnique({
      where: { skillId, uid: user.uid, deletedAt: null },
    });
    if (!skill) {
      throw new SkillNotFoundError('skill not found');
    }

    // delete skill and triggers
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.skillTrigger.updateMany({
        where: { skillId, uid: user.uid },
        data: { deletedAt },
      }),
      this.prisma.skillInstance.update({
        where: { skillId, uid: user.uid },
        data: { deletedAt },
      }),
    ]);

    await this.elasticsearch.deleteSkill(skillId);
  }

  async skillInvokePreCheck(user: User, param: InvokeSkillRequest): Promise<InvokeSkillJobData> {
    const { uid } = user;
    const data: InvokeSkillJobData = { ...param, uid, rawParam: JSON.stringify(param) };

    // Check for token quota
    const usageResult = await this.subscription.checkTokenUsage(user);

    data.modelName ||= this.config.get('skill.defaultModel');
    const modelInfo = await this.prisma.modelInfo.findUnique({ where: { name: data.modelName } });

    if (!modelInfo) {
      throw new ModelNotSupportedError(`model ${data.modelName} not supported`);
    }

    if (!usageResult[modelInfo.tier]) {
      throw new ModelUsageQuotaExceeded(
        `model ${data.modelName} (${modelInfo.tier}) not available for current plan`,
      );
    }

    data.input ??= { query: '' };
    data.context ??= {};
    data.context = await this.populateSkillContext(user, data.context);

    // If skill is specified, find the skill instance and add to job data
    if (data.skillId) {
      const skillInstance = await this.prisma.skillInstance.findUnique({
        where: { skillId: data.skillId, uid: user.uid, deletedAt: null },
      });
      if (!skillInstance) {
        throw new SkillNotFoundError(`skill not found: ${data.skillId}`);
      }

      const skill = skillInstancePO2DTO(skillInstance);
      data.skill = skill;
      data.tplConfig = { ...skill?.tplConfig, ...data.tplConfig };
    }

    // Create or retrieve conversation
    let conversation: ConversationModel | null = null;
    if (data.createConvParam) {
      data.createConvParam.projectId ||= data.projectId;
      conversation = await this.conversation.upsertConversation(
        user,
        data.createConvParam,
        data.convId,
      );
      data.convId = conversation.convId;
    } else if (data.convId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { uid: user.uid, convId: data.convId },
      });
      if (!data.conversation) {
        throw new ConversationNotFoundError(`conversation not found: ${data.convId}`);
      }
    }
    if (conversation) {
      data.conversation = omit(conversation, ['pk']);
    }

    // If project is specified, find the project
    if (data.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { projectId: data.projectId, uid: user.uid, deletedAt: null },
      });
      if (!project) {
        throw new ProjectNotFoundError();
      }
      data.project = projectPO2DTO(project);
    }

    // If job is specified, find the job and add to job data
    let job: SkillJobModel | null = null;
    if (data.jobId) {
      job = await this.prisma.skillJob.findFirst({ where: { jobId: data.jobId } });
    }
    if (!job) {
      // If job is not specified or found, create a new job
      job = await this.createSkillJob(user, data);
    }
    data.job = omit(job, ['pk']);
    data.jobId = data.job.jobId;

    return data;
  }

  /**
   * Populate skill context with actual projects, resources and canvases.
   * These data can be used in skill invocation.
   */
  async populateSkillContext(user: User, context: SkillContext): Promise<SkillContext> {
    const { uid } = user;

    // Populate projects
    if (context.projects?.length > 0) {
      // Query projects which are not populated
      const projectIds = [
        ...new Set(
          context.projects
            .filter((item) => !item.project)
            .map((item) => item.projectId)
            .filter((id) => id),
        ),
      ];
      const projects = await this.prisma.project.findMany({
        where: { projectId: { in: projectIds }, uid, deletedAt: null },
      });
      const projectMap = new Map<string, Project>();
      projects.forEach((p) => projectMap.set(p.projectId, projectPO2DTO(p)));

      context.projects.forEach((item) => {
        if (item.project) return;
        item.project = projectMap.get(item.projectId);
      });
    }

    // Populate resources
    if (context.resources?.length > 0) {
      // Query resources which are not populated
      const resourceIds = [
        ...new Set(
          context.resources
            .filter((item) => !item.resource)
            .map((item) => item.resourceId)
            .filter((id) => id),
        ),
      ];
      const limit = pLimit(5);
      const resources = await Promise.all(
        resourceIds.map((id) =>
          limit(() => this.knowledge.getResourceDetail(user, { resourceId: id })),
        ),
      );
      const resourceMap = new Map<string, Resource>();
      resources.forEach((r) => resourceMap.set(r.resourceId, resourcePO2DTO(r)));

      context.resources.forEach((item) => {
        if (item.resource) return;
        item.resource = resourceMap.get(item.resourceId);
      });
    }

    // Populate documents
    if (context.documents?.length > 0) {
      const docIds = [
        ...new Set(
          context.documents
            .filter((item) => !item.document)
            .map((item) => item.docId)
            .filter((id) => id),
        ),
      ];
      const limit = pLimit(5);
      const docs = await Promise.all(
        docIds.map((id) => limit(() => this.knowledge.getDocumentDetail(user, { docId: id }))),
      );
      const docMap = new Map<string, Document>();
      docs.forEach((d) => docMap.set(d.docId, documentPO2DTO(d)));

      context.documents.forEach((item) => {
        if (item.document) return;
        item.document = docMap.get(item.docId);
      });
    }

    return context;
  }

  async createSkillJob(user: User, param: InvokeSkillJobData) {
    const { input, context, skill, triggerId, convId } = param;

    // remove actual content from context to save storage
    const contextCopy: SkillContext = JSON.parse(JSON.stringify(context ?? {}));
    contextCopy.resources?.forEach(({ resource }) => (resource.content = ''));

    return this.prisma.skillJob.create({
      data: {
        jobId: genSkillJobID(),
        uid: user.uid,
        skillId: skill?.skillId ?? '',
        skillDisplayName: skill?.displayName ?? 'Scheduler',
        input: JSON.stringify(input),
        context: JSON.stringify(contextCopy ?? {}),
        tplConfig: JSON.stringify(param.tplConfig ?? {}),
        status: 'running',
        triggerId,
        convId,
      },
    });
  }

  async sendInvokeSkillTask(user: User, param: InvokeSkillRequest) {
    const data = await this.skillInvokePreCheck(user, param);
    await this.skillQueue.add(CHANNEL_INVOKE_SKILL, data);

    return data.job;
  }

  async invokeSkillFromQueue(jobData: InvokeSkillJobData) {
    const { uid } = jobData;
    const user = await this.prisma.user.findFirst({ where: { uid } });
    if (!user) {
      this.logger.warn(`user not found for uid ${uid} when invoking skill: ${uid}`);
      return;
    }

    await this.streamInvokeSkill(user, jobData);
  }

  async invokeSkillFromApi(user: User, param: InvokeSkillRequest, res: Response) {
    const jobData = await this.skillInvokePreCheck(user, param);

    return this.streamInvokeSkill(user, jobData, res);
  }

  async buildInvokeConfig(
    user: User,
    data: InvokeSkillJobData & {
      eventListener?: (data: SkillEvent) => void;
    },
  ): Promise<SkillRunnableConfig> {
    const { skill, context, convId, tplConfig, conversation, modelName, eventListener } = data;
    const installedSkills: SkillMeta[] = (
      await this.prisma.skillInstance.findMany({
        where: { uid: user.uid, deletedAt: null },
      })
    ).map((s) => ({
      ...pick(s, ['skillId', 'tplName', 'displayName']),
      icon: JSON.parse(s.icon),
    }));

    const displayLocale =
      (await detectLanguage(data?.input?.query)) || data?.locale || user?.uiLocale || 'en';

    const config: SkillRunnableConfig = {
      configurable: {
        ...context,
        modelName,
        locale: displayLocale,
        uiLocale: user.uiLocale,
        installedSkills,
        convId,
        tplConfig,
      },
      user: pick(user, ['uid', 'uiLocale', 'outputLocale']),
    };

    if (skill) {
      config.configurable.selectedSkill = {
        ...pick(skill, ['skillId', 'tplName', 'displayName', 'icon']),
      };
    }

    if (conversation) {
      const messages = await this.prisma.chatMessage.findMany({
        where: { convId: conversation.convId },
        orderBy: { pk: 'asc' },
      });
      config.configurable.chatHistory = messages.map((m) => createLangchainMessage(m));
    }

    if (eventListener) {
      const emitter = new EventEmitter<SkillEventMap>();

      emitter.on('start', eventListener);
      emitter.on('end', eventListener);
      emitter.on('log', eventListener);
      emitter.on('error', eventListener);
      emitter.on('structured_data', eventListener);

      config.configurable.emitter = emitter;
    }

    return config;
  }

  async streamInvokeSkill(user: User, data: InvokeSkillJobData, res?: Response) {
    if (res) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(200);
    }

    try {
      await this._invokeSkill(user, data, res);
      await this.prisma.skillJob.update({
        where: { jobId: data.jobId },
        data: { status: 'finish' },
      });
    } catch (err) {
      writeSSEResponse(res, {
        event: 'error',
        content: JSON.stringify(genBaseRespDataFromError(err)),
      });
      this.logger.error(`invoke skill error: ${err.stack}`);

      await this.prisma.skillJob.update({
        where: { jobId: data.jobId },
        data: { status: 'failed' },
      });
    } finally {
      if (res) {
        res.end(``);
      }
    }
  }

  private async _invokeSkill(user: User, data: InvokeSkillJobData, res?: Response) {
    const { input, conversation, job, rawParam } = data;

    const convParam = conversation
      ? {
          convId: conversation.convId,
          title: input.query,
          uid: user.uid,
        }
      : null;

    let aborted = false;

    if (res) {
      res.on('close', () => {
        this.logger.log('skill invocation aborted due to client disconnect');
        aborted = true;
      });
    }

    const msgAggregator = new MessageAggregator();
    const config = await this.buildInvokeConfig(user, {
      ...data,
      eventListener: async (data: SkillEvent) => {
        if (aborted) {
          this.logger.warn(`skill invocation aborted, ignore event: ${JSON.stringify(data)}`);
          return;
        }

        // Update conversation projectId if intentMatcher result is generateCanvas
        if (data.event === 'structured_data' && data.structuredDataKey === 'intentMatcher') {
          const content = JSON.parse(data.content || '{}');
          const intentType = content.type;
          const projectId = content.projectId;

          if (
            intentType === CanvasIntentType.GenerateDocument &&
            projectId &&
            conversation?.convId
          ) {
            await this.prisma.conversation.update({
              where: { convId: conversation?.convId },
              data: { projectId },
            });
          }
        }

        if (res) {
          writeSSEResponse(res, data);
        }
        msgAggregator.addSkillEvent(data);
      },
    });

    const skill = this.skillInventory.find((s) => s.name === data.skillName);

    // Save user query to conversation right before invoking skill
    // but after the chatHistory of runnable config is built
    await this.conversation.addChatMessages(
      [
        {
          type: 'human',
          content: input.query,
          uid: user.uid,
          convId: conversation?.convId,
          jobId: job?.jobId,
          invokeParam: rawParam,
        },
      ],
      convParam,
    );

    let runMeta: SkillRunnableMeta | null = null;
    const basicUsageData = {
      uid: user.uid,
      convId: conversation?.convId,
      jobId: job?.jobId,
    };

    try {
      for await (const event of skill.streamEvents(input, { ...config, version: 'v2' })) {
        if (aborted) {
          if (runMeta) {
            msgAggregator.addSkillEvent({
              event: 'error',
              spanId: runMeta.spanId,
              skillMeta: runMeta,
              content: 'AbortError',
            });
            msgAggregator.abort();
          }
          throw new Error('AbortError');
        }

        runMeta = event.metadata as SkillRunnableMeta;
        const chunk: AIMessageChunk = event.data?.chunk ?? event.data?.output;

        switch (event.event) {
          case 'on_chat_model_stream':
            if (res) {
              writeSSEResponse(res, {
                event: 'stream',
                skillMeta: runMeta,
                spanId: runMeta.spanId,
                content: chunk.content.toString(),
              });
            }
            break;
          case 'on_chat_model_end':
            if (runMeta && chunk) {
              const modelInfo = await this.subscription.getModelInfo(String(runMeta.ls_model_name));
              if (!modelInfo) {
                this.logger.error(`model not found: ${String(runMeta.ls_model_name)}`);
              }
              const tokenUsage: SyncTokenUsageJobData = {
                ...basicUsageData,
                spanId: runMeta.spanId,
                usage: {
                  tier: modelInfo?.tier,
                  modelProvider: modelInfo?.provider,
                  modelName: modelInfo?.name,
                  inputTokens: chunk.usage_metadata?.input_tokens ?? 0,
                  outputTokens: chunk.usage_metadata?.output_tokens ?? 0,
                },
                skill: pick(runMeta, ['skillId', 'tplName', 'displayName']),
                timestamp: new Date(),
              };
              await this.usageReportQueue.add(tokenUsage);
              msgAggregator.handleStreamEndEvent(runMeta, chunk, tokenUsage.usage);
            }
            break;
        }
      }
    } finally {
      const messages = msgAggregator.getMessages({
        user,
        convId: conversation?.convId,
        jobId: job?.jobId,
      });

      messages.forEach((msg) => {
        writeSSEResponse(res, {
          event: 'usage',
          skillMeta: JSON.parse(msg.skillMeta || '{}'),
          spanId: msg.spanId,
          content: JSON.stringify({ token: JSON.parse(msg.tokenUsage || '{}') }),
        });
      });

      await this.conversation.addChatMessages(messages, convParam);
    }
  }

  async listSkillTriggers(user: User, param: ListSkillTriggersData['query']) {
    const { skillId, page = 1, pageSize = 10 } = param!;

    return this.prisma.skillTrigger.findMany({
      where: { uid: user.uid, skillId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  async startTimerTrigger(user: User, trigger: SkillTriggerModel) {
    if (!trigger.timerConfig) {
      this.logger.warn(`No timer config found for trigger: ${trigger.triggerId}, cannot start it`);
      return;
    }

    if (trigger.bullJobId) {
      this.logger.warn(`Trigger already bind to a bull job: ${trigger.triggerId}, skip start it`);
      return;
    }

    const timerConfig: TimerTriggerConfig = JSON.parse(trigger.timerConfig || '{}');
    const { datetime, repeatInterval } = timerConfig;

    const repeatIntervalToMillis: Record<TimerInterval, number> = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };

    const param: InvokeSkillRequest = {
      input: JSON.parse(trigger.input || '{}'),
      context: JSON.parse(trigger.context || '{}'),
      tplConfig: JSON.parse(trigger.tplConfig || '{}'),
      skillId: trigger.skillId,
      triggerId: trigger.triggerId,
    };

    const job = await this.skillQueue.add(
      CHANNEL_INVOKE_SKILL,
      {
        ...param,
        uid: user.uid,
        rawParam: JSON.stringify(param),
      },
      {
        delay: new Date(datetime).getTime() - new Date().getTime(),
        repeat: repeatInterval ? { every: repeatIntervalToMillis[repeatInterval] } : undefined,
      },
    );

    return this.prisma.skillTrigger.update({
      where: { triggerId: trigger.triggerId },
      data: { bullJobId: String(job.id) },
    });
  }

  async stopTimerTrigger(user: User, trigger: SkillTriggerModel) {
    if (!trigger.bullJobId) {
      this.logger.warn(`No bull job found for trigger: ${trigger.triggerId}, cannot stop it`);
      return;
    }

    const jobToRemove = await this.skillQueue.getJob(trigger.bullJobId);
    if (jobToRemove) {
      await jobToRemove.remove();
    }

    await this.prisma.skillTrigger.update({
      where: { triggerId: trigger.triggerId },
      data: { bullJobId: null },
    });
  }

  async createSkillTrigger(user: User, param: CreateSkillTriggerRequest) {
    const { uid } = user;

    if (param.triggerList.length === 0) {
      throw new ParamsError('trigger list is empty');
    }

    param.triggerList.forEach((trigger) => validateSkillTriggerCreateParam(trigger));

    const triggers = await this.prisma.skillTrigger.createManyAndReturn({
      data: param.triggerList.map((trigger) => ({
        uid,
        triggerId: genSkillTriggerID(),
        displayName: trigger.displayName,
        ...pick(trigger, ['skillId', 'triggerType', 'simpleEventName']),
        ...{
          timerConfig: trigger.timerConfig ? JSON.stringify(trigger.timerConfig) : undefined,
          input: trigger.input ? JSON.stringify(trigger.input) : undefined,
          context: trigger.context ? JSON.stringify(trigger.context) : undefined,
          tplConfig: trigger.tplConfig ? JSON.stringify(trigger.tplConfig) : undefined,
        },
        enabled: !!trigger.enabled,
      })),
    });

    triggers.forEach(async (trigger) => {
      if (trigger.triggerType === 'timer' && trigger.enabled) {
        await this.startTimerTrigger(user, trigger);
      }
    });

    return triggers;
  }

  async updateSkillTrigger(user: User, param: UpdateSkillTriggerRequest) {
    const { uid } = user;
    const { triggerId } = param;
    if (!triggerId) {
      throw new ParamsError('trigger id is required');
    }

    const trigger = await this.prisma.skillTrigger.update({
      where: { triggerId, uid, deletedAt: null },
      data: {
        ...pick(param, ['triggerType', 'displayName', 'enabled', 'simpleEventName']),
        ...{
          timerConfig: param.timerConfig ? JSON.stringify(param.timerConfig) : undefined,
          input: param.input ? JSON.stringify(param.input) : undefined,
          context: param.context ? JSON.stringify(param.context) : undefined,
          tplConfig: param.tplConfig ? JSON.stringify(param.tplConfig) : undefined,
        },
      },
    });

    if (trigger.triggerType === 'timer') {
      if (trigger.enabled && !trigger.bullJobId) {
        await this.startTimerTrigger(user, trigger);
      } else if (!trigger.enabled && trigger.bullJobId) {
        await this.stopTimerTrigger(user, trigger);
      }
    }

    return trigger;
  }

  async deleteSkillTrigger(user: User, param: DeleteSkillTriggerRequest) {
    const { uid } = user;
    const { triggerId } = param;
    if (!triggerId) {
      throw new ParamsError('skill id and trigger id are required');
    }
    const trigger = await this.prisma.skillTrigger.findFirst({
      where: { triggerId, uid, deletedAt: null },
    });
    if (!trigger) {
      throw new ParamsError('trigger not found');
    }

    if (trigger.bullJobId) {
      await this.stopTimerTrigger(user, trigger);
    }

    await this.prisma.skillTrigger.update({
      where: { triggerId: trigger.triggerId, uid: user.uid },
      data: { deletedAt: new Date() },
    });
  }

  async listSkillJobs(user: User, param: ListSkillJobsData['query']) {
    const { skillId, jobStatus, page, pageSize } = param ?? {};
    const jobs = await this.prisma.skillJob.findMany({
      where: { uid: user.uid, skillId, status: jobStatus },
      orderBy: { updatedAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const triggerIds = [...new Set(jobs.map((job) => job.triggerId).filter(Boolean))];
    const convIds = [...new Set(jobs.map((job) => job.convId).filter(Boolean))];

    const [triggers, convs] = await Promise.all([
      this.prisma.skillTrigger.findMany({
        where: { triggerId: { in: triggerIds }, uid: user.uid, deletedAt: null },
      }),
      this.prisma.conversation.findMany({
        where: { convId: { in: convIds }, uid: user.uid },
      }),
    ]);

    const triggerMap = new Map(triggers.map((trigger) => [trigger.triggerId, trigger]));
    const convMap = new Map(convs.map((conv) => [conv.convId, conv]));

    return jobs.map((job) => ({
      ...job,
      trigger: triggerMap.get(job.triggerId),
      conversation: convMap.get(job.convId),
    }));
  }

  async getSkillJobDetail(user: User, jobId: string) {
    if (!jobId) {
      throw new ParamsError('job id is required');
    }

    const { uid } = user;
    const [job, messages] = await Promise.all([
      this.prisma.skillJob.findUnique({
        where: { uid, jobId },
      }),
      this.prisma.chatMessage.findMany({
        where: { uid, jobId },
        orderBy: { pk: 'asc' },
      }),
    ]);

    return { ...job, messages };
  }
}
