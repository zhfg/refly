import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import {
  Icon,
  SkillInvocationConfig,
  SkillTemplateConfigDefinition,
} from '@refly-packages/openapi-schema';
import { GraphState } from '../scheduler/types';

// Import prompt sections
import {
  reactiveArtifactInstructions,
  reactiveArtifactGoals,
} from '../scheduler/module/artifacts/prompt';
import { reactiveArtifactExamples } from '../scheduler/module/artifacts/examples';

// utils
import { buildFinalRequestMessages } from '../scheduler/utils/message';
import { prepareContext } from '../scheduler/utils/context';
import { processQuery } from '../scheduler/utils/queryProcessor';
import { extractAndCrawlUrls } from '../scheduler/utils/extract-weblink';
import { safeStringifyJSON } from '@refly-packages/utils';
import { truncateSource } from '../scheduler/utils/truncator';
import { checkModelContextLenSupport } from '../scheduler/utils/model';

// Import prompt building functions
import {
  buildArtifactsSystemPrompt,
  buildArtifactsUserPrompt,
  buildArtifactsContextUserPrompt,
} from '../scheduler/module/artifacts';

/**
 * Artifacts Skill
 *
 * Generates React/TypeScript components for data visualization and interactive UIs
 */
export class Artifacts extends BaseSkill {
  name = 'artifacts';

  icon: Icon = { type: 'emoji', value: '🧩' };

  configSchema: SkillTemplateConfigDefinition = {
    items: [
      {
        key: 'optimizeComponents',
        inputMode: 'switch',
        defaultValue: true,
        labelDict: {
          en: 'Optimize Components',
          'zh-CN': '优化组件',
        },
        descriptionDict: {
          en: 'Enable performance optimizations (React.memo, useMemo, useCallback)',
          'zh-CN': '启用性能优化 (React.memo, useMemo, useCallback)',
        },
      },
    ],
  };

  invocationConfig: SkillInvocationConfig = {};

  description = 'Generate React components for data visualization and interactive UIs';

  schema = z.object({
    query: z.string().optional().describe('The request for generating a component'),
    images: z.array(z.string()).optional().describe('Reference images for the component'),
  });

  graphState: StateGraphArgs<BaseSkillState>['channels'] = {
    ...baseStateGraphArgs,
  };

  // Generate the full prompt by combining all sections
  generateFullPrompt = (): string => {
    return `${reactiveArtifactInstructions}

${reactiveArtifactGoals}

${reactiveArtifactExamples}`;
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

    // Extract URLs from the query and crawl them if needed
    const { sources: urlSources, analysis } = await extractAndCrawlUrls(query, config, this, {
      concurrencyLimit: 5,
      batchSize: 8,
    });

    this.engine.logger.log(`URL extraction analysis: ${safeStringifyJSON(analysis)}`);
    this.engine.logger.log(`Extracted URL sources count: ${urlSources.length}`);

    let context = '';
    let sources = [];

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

    // Custom module for building messages using our prompt module functions
    const module = {
      buildSystemPrompt: buildArtifactsSystemPrompt,
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
    });

    return { requestMessages, sources, context, query };
  };

  callGenerateArtifact = async (
    state: GraphState,
    config: SkillRunnableConfig,
  ): Promise<Partial<GraphState>> => {
    const { currentSkill } = config.configurable;

    // Get the "optimizeComponents" config value or default to true
    const optimizeComponents = config?.configurable?.tplConfig?.optimizeComponents?.value ?? true;

    // Preprocess the query
    const { requestMessages, sources, query } = await this.commonPreprocess(state, config);

    // Set current step
    config.metadata.step = { name: 'generateArtifact' };

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
    const model = this.engine.chatModel({ temperature: 0.7 });

    // Let the front-end know we're generating an artifact
    this.emitEvent(
      {
        log: {
          key: 'generatingArtifact',
          descriptionArgs: { query },
        },
      },
      config,
    );

    // Generate the response
    const responseMessage = await model.invoke(requestMessages, {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
        artifactConfig: {
          optimizeComponents,
        },
      },
    });

    // Signal completion of artifact generation
    this.emitEvent(
      {
        log: {
          key: 'artifactGenerated',
          descriptionArgs: { query },
        },
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
