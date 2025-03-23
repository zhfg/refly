import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import {
  Icon,
  SkillInvocationConfig,
  SkillTemplateConfigDefinition,
  Artifact,
} from '@refly-packages/openapi-schema';
import { GraphState } from '../scheduler/types';
import { randomUUID } from 'node:crypto';

// Import prompt sections
import { reactiveArtifactInstructions } from '../scheduler/module/artifacts/prompt';

// utils
import { buildFinalRequestMessages } from '../scheduler/utils/message';
import { prepareContext } from '../scheduler/utils/context';
import { processQuery } from '../scheduler/utils/queryProcessor';
import { extractAndCrawlUrls } from '../scheduler/utils/extract-weblink';
import { safeStringifyJSON } from '@refly-packages/utils';
import { truncateSource } from '../scheduler/utils/truncator';
import { checkModelContextLenSupport } from '../scheduler/utils/model';
import { processContextUrls } from '../utils/url-processing';

// Import prompt building functions - only import what we need
import {
  buildArtifactsUserPrompt,
  buildArtifactsContextUserPrompt,
  buildArtifactsFullSystemPrompt,
} from '../scheduler/module/artifacts';
/**
 * Code Artifacts Skill
 *
 * Generates React/TypeScript components for data visualization and interactive UIs
 */
export class CodeArtifacts extends BaseSkill {
  name = 'codeArtifacts';

  icon: Icon = { type: 'emoji', value: '🧩' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [],
  };

  invocationConfig: SkillInvocationConfig = {};

  description =
    'Generate artifacts for the given query, including code snippets, html, svg, markdown, and more';

  schema = z.object({
    query: z.string().optional().describe('The request for generating an artifact'),
    images: z.array(z.string()).optional().describe('Reference images for the artifact'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  // Generate the full prompt by combining all sections
  generateFullPrompt = (): string => {
    return `${reactiveArtifactInstructions}`;
  };

  commonPreprocess = async (state: GraphState, config: SkillRunnableConfig) => {
    const { messages = [], images = [] } = state;
    const { locale = 'en', modelInfo } = config.configurable;

    config.metadata.step = { name: 'analyzeQuery' };

    // Use shared query processor
    const {
      optimizedQuery,
      query,
      usedChatHistory,
      hasContext,
      remainingTokens,
      mentionedContext,
      rewrittenQueries,
    } = await processQuery({
      config,
      ctxThis: this,
      state,
    });

    // Process URLs from frontend context if available
    const contextUrls = config.configurable?.urls || [];
    const contextUrlSources = await processContextUrls(contextUrls, config, this);

    // Combine contextUrlSources with other sources if needed
    if (contextUrlSources.length > 0) {
      // If you have existing sources array, you can combine them
      // sources = [...sources, ...contextUrlSources];
      this.engine.logger.log(`Added ${contextUrlSources.length} URL sources from context`);
    }

    // Extract URLs from the query and crawl them if needed
    const { sources: querySources, analysis } = await extractAndCrawlUrls(query, config, this, {
      concurrencyLimit: 5,
      batchSize: 8,
    });

    this.engine.logger.log(`URL extraction analysis: ${safeStringifyJSON(analysis)}`);
    this.engine.logger.log(`Extracted URL sources count: ${querySources.length}`);

    let context = '';
    let sources = [];

    const urlSources = [...contextUrlSources, ...querySources];

    // Consider URL sources for context preparation
    const hasUrlSources = urlSources.length > 0;
    const needPrepareContext = (hasContext || hasUrlSources) && remainingTokens > 0;
    const isModelContextLenSupport = checkModelContextLenSupport(modelInfo);

    this.engine.logger.log(`optimizedQuery: ${optimizedQuery}`);
    this.engine.logger.log(`mentionedContext: ${safeStringifyJSON(mentionedContext)}`);
    this.engine.logger.log(`hasUrlSources: ${hasUrlSources}`);

    if (needPrepareContext) {
      config.metadata.step = { name: 'analyzeContext' };
      const preparedRes = await prepareContext(
        {
          query: optimizedQuery,
          mentionedContext,
          maxTokens: remainingTokens,
          enableMentionedContext: hasContext,
          rewrittenQueries,
          urlSources,
        },
        {
          config,
          ctxThis: this,
          state,
          tplConfig: config?.configurable?.tplConfig || {},
        },
      );

      context = preparedRes.contextStr;
      sources = preparedRes.sources;
    }

    // Custom module for building messages
    const module = {
      // Custom system prompt that includes examples
      buildSystemPrompt: () => {
        return buildArtifactsFullSystemPrompt();
      },
      buildContextUserPrompt: buildArtifactsContextUserPrompt,
      buildUserPrompt: buildArtifactsUserPrompt,
    };

    const requestMessages = buildFinalRequestMessages({
      module,
      locale,
      chatHistory: usedChatHistory,
      messages,
      needPrepareContext: needPrepareContext && isModelContextLenSupport,
      context,
      images,
      originalQuery: query,
      optimizedQuery,
      rewrittenQueries,
      modelInfo: config.configurable.modelInfo,
    });

    return { requestMessages, sources, context, query };
  };

  callGenerateArtifact = async (
    state: GraphState,
    config: SkillRunnableConfig,
  ): Promise<Partial<GraphState>> => {
    const { currentSkill } = config.configurable;

    // Preprocess the query
    const { requestMessages, sources, query } = await this.commonPreprocess(state, config);

    // Set current step
    config.metadata.step = { name: 'generateCodeArtifact' };

    // Create a code artifact entity
    const title = '';
    const codeEntityId = randomUUID();

    // Create and emit the code artifact
    const artifact: Artifact = {
      type: 'codeArtifact',
      entityId: codeEntityId,
      title: title,
    };

    this.emitEvent(
      {
        event: 'artifact',
        artifact: { ...artifact, status: 'generating' },
      },
      config,
    );

    // Emit sources if available
    if (sources?.length > 0) {
      const truncatedSources = truncateSource(sources);
      await this.emitLargeDataEvent(
        {
          data: truncatedSources,
          buildEventData: (chunk, { isPartial, chunkIndex, totalChunks }) => ({
            structuredData: {
              sources: chunk,
              isPartial,
              chunkIndex,
              totalChunks,
            },
          }),
        },
        config,
      );
    }

    // Use a slightly higher temperature for more creative code generation
    const model = this.engine.chatModel({ temperature: 0.1 });

    // Let the front-end know we're generating an artifact
    this.emitEvent(
      {
        log: {
          key: 'generatingCodeArtifact',
          descriptionArgs: { query },
        },
      },
      config,
    );

    // Add specific configuration to metadata for the model
    const enhancedConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
        artifact,
      },
    };

    // Generate the response
    const responseMessage = await model.invoke(requestMessages, enhancedConfig);

    // Signal completion of artifact generation
    this.emitEvent(
      {
        log: {
          key: 'codeArtifactGenerated',
          descriptionArgs: { query },
        },
      },
      config,
    );

    this.emitEvent(
      {
        event: 'artifact',
        artifact: { ...artifact, status: 'finish' },
      },
      config,
    );

    return { messages: [responseMessage] };
  };

  toRunnable(): Runnable<any, any, RunnableConfig> {
    const workflow = new StateGraph<BaseSkillState>({
      channels: this.graphState,
    }).addNode('generateArtifact', this.callGenerateArtifact);

    workflow.addEdge(START, 'generateArtifact');
    workflow.addEdge('generateArtifact', END);

    return workflow.compile();
  }
}
