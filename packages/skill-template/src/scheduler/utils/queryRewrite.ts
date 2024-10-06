import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GraphState, IContext, QueryAnalysis } from '../types';
import { summarizeChatHistory, summarizeContext } from './context';
import { z } from 'zod';
import { SkillEngine } from '../../engine';
import { BaseSkill, SkillRunnableConfig } from '@/base';
import { ChatMessage } from '@refly-packages/openapi-schema';

// TODO: collections 搜索和在整个知识库搜索一起实现
export async function analyzeQueryAndContext(
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState },
): Promise<QueryAnalysis> {
  const { chatHistory, resources, notes, contentList, collections } = ctx.configSnapshot.configurable;
  const context: IContext = {
    resources,
    notes,
    contentList,
    collections,
  };

  ctx.ctxThis.emitEvent({ event: 'log', content: 'Analyzing query and context...' }, ctx.configSnapshot);
  const summarizedContext = summarizeContext(context);
  const summarizedChatHistory = summarizeChatHistory((chatHistory as any as ChatMessage[]) || []);

  const systemPrompt = `You are an advanced AI assistant specializing in query analysis and context extraction. Your task is to analyze the given query, chat history, and available context to:
1. Rewrite the query to best represent the user's intent, considering the conversation history and available context.
2. Identify any specific context items (notes, resources, or content) mentioned in the query.
3. Determine the primary intent of the query.

Available context types:
- Notes: Referred to by title or @note
- Resources: Referred to by title or @resource
- User-selected content: Referred to by title or content

Output your analysis in the following format:
{
  "rewrittenQuery": "The rewritten query that best represents the user's intent",
  "mentionedContext": [
    {
      "type": "note" | "resource" | "content",
      "entityId": "ID of the mentioned item (if available)",
      "title": "Title of the mentioned item"
    }
  ],
  "intent": "The primary intent of the query (e.g., SEARCH_QA, WRITING, READING_COMPREHENSION, or OTHER)",
  "confidence": 0.0 to 1.0,
  "reasoning": "A brief explanation of your analysis and rewriting process"
}`;

  const userMessage = `Query: ${query}

## Chat History:
${summarizedChatHistory}

## Available Context:
${summarizedContext}

Please analyze the query, considering the chat history and available context.`;

  const model = ctx.ctxThis.engine.chatModel({ temperature: 0.3 });
  const runnable = model.withStructuredOutput(
    z.object({
      rewrittenQuery: z.string(),
      mentionedContext: z.array(
        z.object({
          type: z.enum(['note', 'resource', 'content']),
          entityId: z.string().optional(),
          title: z.string(),
        }),
      ),
      intent: z.enum(['SEARCH_QA', 'WRITING', 'READING_COMPREHENSION', 'OTHER']),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    }),
  );

  const result = await runnable.invoke([new SystemMessage(systemPrompt), new HumanMessage(userMessage)]);

  ctx.ctxThis.engine.logger.log(`Rewritten Query: ${result.rewrittenQuery}`);
  ctx.ctxThis.engine.logger.log(`Mentioned Context: ${JSON.stringify(result.mentionedContext)}`);
  ctx.ctxThis.engine.logger.log(`Intent: ${result.intent} (confidence: ${result.confidence})`);
  ctx.ctxThis.engine.logger.log(`Reasoning: ${result.reasoning}`);

  ctx.ctxThis.emitEvent({ event: 'log', content: `Rewritten Query: ${result.rewrittenQuery}` }, ctx.configSnapshot);
  ctx.ctxThis.emitEvent(
    { event: 'log', content: `Mentioned Context: ${JSON.stringify(result.mentionedContext)}` },
    ctx.configSnapshot,
  );
  ctx.ctxThis.emitEvent(
    { event: 'log', content: `Intent: ${result.intent} (confidence: ${result.confidence})` },
    ctx.configSnapshot,
  );
  ctx.ctxThis.emitEvent({ event: 'log', content: `Reasoning: ${result.reasoning}` }, ctx.configSnapshot);

  return {
    optimizedQuery: result.rewrittenQuery,
    mentionedContext: result.mentionedContext,
    intent: result.intent,
    confidence: result.confidence,
    reasoning: result.reasoning,
    relevantContext: [], // This will be populated by prepareRelevantContext
  };
}
