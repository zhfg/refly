import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GraphState, IContext, MentionedContextItem, QueryAnalysis } from '../types';
import { summarizeChatHistory, summarizeContext } from './summarizer';
import { z } from 'zod';
import { SkillEngine } from '../../engine';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { SkillTemplateConfig } from '@refly-packages/openapi-schema';

// simplify context entityId for better extraction
export const preprocessContext = (context: IContext): IContext => {
  const { resources, notes, contentList, collections } = context;

  const preprocessedContext = {
    resources: resources.map((r, index) => ({ ...r, resourceId: `resource-${index}` })),
    notes: notes.map((n, index) => ({ ...n, noteId: `note-${index}` })),
    contentList: contentList.map((c, index) => ({ ...c, metadata: { ...c.metadata, entityId: `content-${index}` } })),
    collections: collections.map((c, index) => ({ ...c, collectionId: `collection-${index}` })),
  };

  return preprocessedContext;
};

export const postprocessContext = (
  mentionedContextList: MentionedContextItem[],
  originalContext: IContext,
): IContext => {
  let context: IContext = {
    resources: [],
    notes: [],
    contentList: [],
    collections: [],
  };

  mentionedContextList.forEach((item) => {
    if (item.type === 'note') {
      // 这里需要根据entityId在originalContext中找到对应的note
      const originalNote = originalContext.notes.find((n) => n.noteId === item.entityId);
      context.notes.push({ ...originalNote, noteId: item.entityId });
    } else if (item.type === 'resource') {
      // 这里需要根据entityId在originalContext中找到对应的resource
      const originalResource = originalContext.resources.find((r) => r.resourceId === item.entityId);
      context.resources.push({ ...originalResource, resourceId: item.entityId });
    } else if (item.type === 'selectedContent') {
      // 这里需要根据entityId在originalContext中找到对应的selectedContent
      const originalSelectedContent = originalContext.contentList.find((c) => c.metadata.entityId === item.entityId);
      context.contentList.push({
        ...originalSelectedContent,
        metadata: { ...originalSelectedContent.metadata, entityId: item.entityId },
      });
    }
  });

  return context;
};

// TODO: build chatHistory and context related system prompt
export async function analyzeQueryAndContext(
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<QueryAnalysis> {
  const { chatHistory, resources, notes, contentList, collections } = ctx.configSnapshot.configurable;
  const context: IContext = {
    resources,
    notes,
    contentList,
    collections,
  };

  ctx.ctxThis.emitEvent({ event: 'log', content: 'Analyzing query and context...' }, ctx.configSnapshot);

  // preprocess context for better extract mentioned context
  const preprocessedContext = preprocessContext(context);
  const summarizedContext = summarizeContext(preprocessedContext);
  const summarizedChatHistory = summarizeChatHistory(chatHistory || []);

  const systemPrompt = `## Role & Background \n You are an advanced AI assistant specializing in query analysis and context extraction. Your task is to analyze the given query, chat history, and available context to:
1. Rewrite the query to best represent the user's intent, considering the conversation history and available context. If specific entities or concepts are mentioned, ensure they are fully expanded and clarified in the rewritten query. If no specific entities are mentioned, the rewritten query may remain general.
2. Identify any specific context items (notes, resources, or selectedContent) mentioned in the query. If none are mentioned, leave this list empty.
3. Determine the primary intent of the query.

## Examples
Examples of query rewriting with chat history and context:

1. Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>What were the key points from yesterday's meeting?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>The key points from yesterday's meeting were: 1) Project timeline update, 2) Budget allocation for Q3, and 3) New hiring plans for the engineering team.</ChatHistoryItem>
   <ChatHistoryItem type={human}>Can you elaborate on the hiring plans?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>Certainly! The hiring plans for the engineering team include opening 5 new positions: 2 senior developers, 2 QA engineers, and 1 DevOps specialist. The goal is to have these positions filled by the end of Q3.</ChatHistoryItem>
   </ChatHistory>

   Context:
   <Context>
   <KnowledgeBaseItem type='note' entityId='note-1' title='Meeting Minutes - Engineering Team'>Discussed the need for additional backend developers to support the new microservices architecture...</KnowledgeBaseItem>
   </Context>

   Original query: "What about backend developers?"
   Rewritten query: "Regarding the engineering team's hiring plans discussed earlier, are there any specific plans or needs for hiring backend developers, especially considering the note about supporting the new microservices architecture?"

2. Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>What's the latest update on our AI project?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>The latest update on our AI project is that we've successfully implemented natural language processing capabilities and are now moving on to improving our machine learning models.</ChatHistoryItem>
   </ChatHistory>

   Context:
   <Context>
   <UserSelectedContent from='web' entityId='content-1' title='AI Trends 2023' weblinkUrl='https://example.com/ai-trends'>Experts predict a surge in AI applications for healthcare and finance sectors...</UserSelectedContent>
   </Context>

   Original query: "How does this compare to industry trends?"
   Rewritten query: "How does our AI project's focus on natural language processing and machine learning model improvement compare to the industry trends, particularly the predicted surge in AI applications for healthcare and finance sectors mentioned in the 'AI Trends 2023' article?"

3. Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>What's our current market share?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>Based on the latest market analysis, our current market share is approximately 15% in the global market and 22% in the domestic market.</ChatHistoryItem>
   </ChatHistory>

   Context:
   <Context>
   <KnowledgeBaseItem type='resource' entityId='resource-1' title='Competitor Analysis 2023'>Our main competitor, TechCorp, has seen a 2% increase in market share over the last quarter...</KnowledgeBaseItem>
   </Context>

   Original query: "And what about our main competitor?"
   Rewritten query: "What is the current market share and recent performance of our main competitor, TechCorp, in comparison to our 15% global and 22% domestic market share, considering the information from the 'Competitor Analysis 2023' resource?"

4. Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>Can you summarize our Q2 financial results?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>Certainly! Our Q2 financial results showed a 10% increase in revenue, 5% increase in profit margins, and we exceeded our sales targets by 15%.</ChatHistoryItem>
   </ChatHistory>

   Context:
   <Context>
   <KnowledgeBaseItem type='resource' entityId='res2' title='Q2 Financial Report'>Detailed breakdown of revenue streams, cost analysis, and projections for Q3...</KnowledgeBaseItem>
   </Context>

   Original query: "How do I reset my email password?"
   Rewritten query: "How do I reset my email password?"

## Output Format
Output your analysis in the following format:
{
  "rewrittenQuery": "The rewritten query that best represents the user's intent",
  "mentionedContext": [
    {
      "type": "note" | "resource" | "selectedContent",
      "entityId": "ID of the mentioned item (if available)",
      "title": "Title of the mentioned item",
      "url": "URL of the mentioned item (if available)"
    }
  ],
  "intent": "The primary intent of the query (e.g., SEARCH_QA, WRITING, READING_COMPREHENSION, or OTHER)",
  "confidence": 0.0 to 1.0,
  "reasoning": "A brief explanation of your analysis and rewriting process"
}`;

  const userMessage = `## User Query \n ${query}

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
          type: z.enum(['note', 'resource', 'selectedContent']),
          entityId: z.string().optional(),
          title: z.string(),
          url: z.string().optional(),
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
    mentionedContext: postprocessContext(result.mentionedContext, context),
    intent: result.intent,
    confidence: result.confidence,
    reasoning: result.reasoning,
  };
}
