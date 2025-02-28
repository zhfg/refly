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

// Import prompt building functions - only import what we need
import {
  buildArtifactsUserPrompt,
  buildArtifactsContextUserPrompt,
  buildArtifactsFullSystemPrompt,
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
      {
        key: 'useTailwind',
        inputMode: 'switch',
        defaultValue: true,
        labelDict: {
          en: 'Use Tailwind CSS',
          'zh-CN': '使用 Tailwind CSS',
        },
        descriptionDict: {
          en: 'Style components using Tailwind CSS utility classes',
          'zh-CN': '使用 Tailwind CSS 实用类设计组件',
        },
      },
      {
        key: 'strictErrorHandling',
        inputMode: 'switch',
        defaultValue: true,
        labelDict: {
          en: 'Strict Error Handling',
          'zh-CN': '严格错误处理',
        },
        descriptionDict: {
          en: 'Add comprehensive error handling and edge case management',
          'zh-CN': '添加全面的错误处理和边缘情况管理',
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

    // Custom module for building messages
    const module = {
      // Custom system prompt that includes examples
      buildSystemPrompt: () => {
        return buildArtifactsFullSystemPrompt(reactiveArtifactExamples);
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
    });

    return { requestMessages, sources, context, query };
  };

  /**
   * Extract and validate React code from model response
   * @param response The model's response
   * @returns Validated React code or null if validation fails
   */
  validateReactCode = (response: string): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];

    // Check if response contains reflyArtifact
    if (!response.includes('<reflyArtifact')) {
      issues.push('Missing reflyArtifact tag');
      return { valid: false, issues };
    }

    // Extract the actual code content from reflyArtifact tag
    const startTag = '<reflyArtifact';
    const endTag = '</reflyArtifact>';
    const startIndex = response.indexOf(startTag);
    const endIndex = response.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1) {
      issues.push('Invalid reflyArtifact tags structure');
      return { valid: false, issues };
    }

    const content = response.substring(startIndex, endIndex + endTag.length);

    // Basic checks for required elements
    const requiredImports = [
      { name: 'React', pattern: /import\s+React/i },
      { name: 'useState', pattern: /import.*useState/i },
      { name: 'useCallback', pattern: /import.*useCallback/i },
      { name: 'useMemo', pattern: /import.*useMemo/i },
    ];

    for (const { name, pattern } of requiredImports) {
      if (!pattern.test(content)) {
        issues.push(`Missing required import: ${name}`);
      }
    }

    // Check for duplicate variable definitions
    const variableDefinitionPattern = /const\s+(\w+)\s*=/g;
    const definedVariables = new Set<string>();
    let match: RegExpExecArray | null = variableDefinitionPattern.exec(content);
    while (match !== null) {
      const varName = match[1];
      if (definedVariables.has(varName)) {
        issues.push(`Duplicate variable definition: ${varName}`);
      }
      definedVariables.add(varName);
      match = variableDefinitionPattern.exec(content);
    }

    // Check for proper export
    if (!content.includes('export default')) {
      issues.push('Missing default export');
    }

    // Check for proper React.memo usage
    if (content.includes('React.FC') && !content.includes('React.memo')) {
      issues.push('Missing React.memo optimization');
    }

    // Check for proper TypeScript typing
    if (!content.includes('type') && !content.includes('interface')) {
      issues.push('Missing TypeScript type definitions');
    }

    // Check for proper dependency arrays in useEffect
    const useEffectPattern = /useEffect\(\s*\(\)\s*=>\s*{[^}]*}\s*,\s*\[(.*?)]/g;
    let effectMatch: RegExpExecArray | null = useEffectPattern.exec(content);
    while (effectMatch !== null) {
      // Empty dependency array is valid, but no dependency array is a problem
      effectMatch = useEffectPattern.exec(content);
    }

    // Check for empty dependency array in useEffect
    if (content.includes('useEffect') && !useEffectPattern.test(content)) {
      issues.push('Missing or invalid dependency array in useEffect');
    }

    // Check for Tailwind CSS usage
    if (!content.includes('className=')) {
      issues.push('Missing Tailwind CSS classes (className prop)');
    }

    // Check for proper key props in array mapping
    if (content.includes('.map(') && !content.includes('key={')) {
      issues.push('Missing key prop in array mapping');
    }

    // Check for null checks or optional chaining
    if (content.includes('.map(') && !content.includes('?.') && !content.includes('&& ')) {
      issues.push('Missing null checks before array operations');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  };

  callGenerateArtifact = async (
    state: GraphState,
    config: SkillRunnableConfig,
  ): Promise<Partial<GraphState>> => {
    const { currentSkill } = config.configurable;

    // Get configuration values
    const optimizeComponents = config?.configurable?.tplConfig?.optimizeComponents?.value ?? true;
    const useTailwind = config?.configurable?.tplConfig?.useTailwind?.value ?? true;
    const strictErrorHandling = config?.configurable?.tplConfig?.strictErrorHandling?.value ?? true;

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

    // Add specific configuration to metadata for the model
    const enhancedConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        ...currentSkill,
        artifactConfig: {
          optimizeComponents,
          useTailwind,
          strictErrorHandling,
          codeStandards: {
            useSingleQuotes: true,
            useEnglishComments: true,
            useOptionalChaining: true,
            useNullishCoalescing: true,
            validateArraysBeforeUse: true,
            validatePropsBeforeDestructuring: true,
            useProperKeyProps: true,
            avoidInlineObjectCreation: true,
          },
        },
      },
    };

    // Generate the response
    let responseMessage = await model.invoke(requestMessages, enhancedConfig);

    // Validate the generated code - assuming the content is a string
    const responseContent =
      typeof responseMessage.content === 'string'
        ? responseMessage.content
        : JSON.stringify(responseMessage.content);

    const validation = this.validateReactCode(responseContent);

    // If there are issues, try to regenerate with more specific instructions
    if (!validation.valid) {
      this.engine.logger.log(`Validation issues: ${validation.issues.join(', ')}`);

      // Add a system message about the validation issues
      const issuesPrompt = `The previous response had the following code issues: ${validation.issues.join(', ')}. 
Please regenerate the React component, ensuring you address these specific issues. 
Remember to:
- Avoid duplicate variable definitions
- Include proper React imports
- Use React.memo for functional components
- Export the component as default
- Use proper TypeScript typing
- Ensure all variables are properly initialized
- Use consistent syntax for event handlers`;

      // Add the issues prompt to the request messages
      const enhancedMessages = [
        ...requestMessages,
        {
          role: 'system',
          content: issuesPrompt,
        },
      ];

      // Try again with enhanced instructions but without temperature parameter
      responseMessage = await model.invoke(enhancedMessages, enhancedConfig);
    }

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
