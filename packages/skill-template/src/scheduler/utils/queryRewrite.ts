import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GraphState, IContext, MentionedContextItem, QueryAnalysis } from '../types';
import { summarizeChatHistory, summarizeContext } from './summarizer';
import { z } from 'zod';
import { SkillEngine } from '../../engine';
import { BaseSkill, SkillRunnableConfig } from '../../base';
import { SkillTemplateConfig } from '@refly-packages/openapi-schema';
import { ModelContextLimitMap } from './token';
import { MAX_CONTEXT_RATIO, MAX_QUERY_TOKENS_RATIO } from './constants';
import { truncateText } from './truncator';
import { safeStringifyJSON } from '@refly-packages/utils';

// simplify context entityId for better extraction
export const preprocessContext = (context: IContext): IContext => {
  const { resources, notes, contentList, collections } = context;

  const preprocessedContext = {
    resources: resources.map((r, index) => ({ ...r, resource: { ...r.resource, resourceId: `resource-${index}` } })),
    notes: notes.map((n, index) => ({ ...n, note: { ...n.note, noteId: `note-${index}` } })),
    contentList: contentList.map((c, index) => ({ ...c, metadata: { ...c.metadata, entityId: `content-${index}` } })),
    collections: collections.map((c, index) => ({
      ...c,
      collection: { ...c.collection, collectionId: `collection-${index}` },
    })),
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
      const originalNote = originalContext.notes.find((n, index) => `note-${index}` === item.entityId);
      if (originalNote) {
        context.notes.push({
          ...originalNote,
          metadata: { ...originalNote.metadata, useWholeContent: item?.useWholeContent },
        });
      }
    } else if (item.type === 'resource') {
      // 这里需要根据entityId在originalContext中找到对应的resource
      const originalResource = originalContext.resources.find((r, index) => `resource-${index}` === item.entityId);
      if (originalResource) {
        context.resources.push({
          ...originalResource,
          metadata: { ...originalResource.metadata, useWholeContent: item?.useWholeContent },
        });
      }
    } else if (item.type === 'selectedContent') {
      // 这里需要根据entityId在originalContext中找到对应的selectedContent
      const originalSelectedContent = originalContext.contentList.find(
        (c, index) => `content-${index}` === item.entityId,
      );
      if (originalSelectedContent) {
        context.contentList.push({
          ...originalSelectedContent,
          metadata: { ...originalSelectedContent.metadata, useWholeContent: item?.useWholeContent },
        });
      }
    }
  });

  return context;
};

export const buildAnalyzeQuerySystemPromptExamples = () => {
  return `
Examples of query rewriting with context and chat history:

1. Context:
   <Context>
   <ContextItem type='selectedContent' from='note' entityId='content-1'  title='AI in Knowledge Management'>This indeed allows more people to efficiently access specialized knowledge. Combined with its paper collection and management functions, it essentially achieves a one-stop service from search acquisition, query dialogue for knowledge acquisition, to knowledge management, rather than just being a simple AI tool product.</ContextItem>
   </Context>

   Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>Which company has the best embedding technology?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>In the current market, companies with notable performance in embedding technology include: ...</ChatHistoryItem>
   </ChatHistory>

   Original query: "Translate to French"
   Rewritten query: "Please translate the selected context about AI in Knowledge Management into French."
   mentionedContext: [
     {
       "type": "selectedContent",
       "entityId": "content-1",
       "title": "AI in Knowledge Management",
       "useWholeContent": true
     }
   ]
   Reasoning: The original query is a simple instruction to translate. Since there's relevant context provided about AI in Knowledge Management, we assume the user wants this specific content translated. We need to use the whole content for accurate translation, so useWholeContent is set to true. The chat history is not relevant to this query, so it's ignored.

2. Context:
   <Context>
   <ContextItem type='note' entityId='note-1' title='Meeting Minutes - Engineering Team'>Discussed the need for additional backend developers to support the new microservices architecture. The team agreed on hiring at least three senior developers with experience in distributed systems.</ContextItem>
   </Context>

   Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>What were the key points from yesterday's meeting?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>The key points from yesterday's meeting were: 1) Project timeline update, 2) Budget allocation for Q3, and 3) New hiring plans for the engineering team.</ChatHistoryItem>
   </ChatHistory>

   Original query: "Summarize the main points"
   Rewritten query: "Please summarize the main points from the meeting minutes about the need for additional backend developers and the hiring plans for the microservices architecture."
   mentionedContext: [
     {
       "type": "note",
       "entityId": "note-1",
       "title": "Meeting Minutes - Engineering Team",
       "useWholeContent": true
     }
   ]
   Reasoning: The original query asks for a summary of main points. Given the specific context of meeting minutes about backend developers and microservices architecture, we focus the summary request on this provided context. We need to use the whole content of the meeting minutes to provide an accurate summary, so useWholeContent is set to true. The chat history provides some general information but is not as specific as the context, so it's not directly incorporated into the rewritten query.

3. Context:
   <Context>
   <ContextItem type='selectedContent' from='web' entityId='content-2' title='AI Trends 2023' weblinkUrl='https://example.com/ai-trends'>Experts predict a surge in AI applications for healthcare and finance sectors. The report highlights advancements in natural language processing and computer vision as key drivers for this growth.</ContextItem>
   </Context>

   Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>What's the latest update on our AI project?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>The latest update on our AI project is that we've successfully implemented natural language processing capabilities and are now moving on to improving our machine learning models.</ChatHistoryItem>
   </ChatHistory>

   Original query: "How does this compare to our project?"
   Rewritten query: "How do the AI trends for healthcare and finance sectors, and the advancements in natural language processing and computer vision mentioned in the 'AI Trends 2023' article, compare to our AI project's current focus and progress?"
   mentionedContext: [
     {
       "type": "selectedContent",
       "entityId": "content-2",
       "title": "AI Trends 2023",
       "url": "https://example.com/ai-trends",
       "useWholeContent": true
     }
   ]
   Reasoning: The original query asks for a comparison, but it's ambiguous what "this" refers to. Given the provided context about AI trends and the chat history about the company's AI project, we rewrite the query to explicitly compare the industry trends from the context with the project progress mentioned in the chat history. We need to use the whole content of the AI Trends 2023 article to make a comprehensive comparison, so useWholeContent is set to true. The chat history is also relevant in this case, as it provides information about the current state of the company's AI project, which is incorporated into the rewritten query.

4. Context:
   <Context>
   <ContextItem type='resource' entityId='resource-2' title='Q2 Financial Report'>Detailed breakdown of revenue streams, cost analysis, and projections for Q3...</ContextItem>
   </Context> 

   Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>Can you summarize our Q2 financial results?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>Certainly! Our Q2 financial results showed a 10% increase in revenue, 5% increase in profit margins, and we exceeded our sales targets by 15%.</ChatHistoryItem>
   </ChatHistory>

   Original query: "What are the key AI-related investments mentioned in the report?"
   Rewritten query: "What are the key AI-related investments mentioned in the Q2 Financial Report?"
   mentionedContext: [
     {
       "type": "resource",
       "entityId": "resource-2",
       "title": "Q2 Financial Report",
       "useWholeContent": false
     }
   ]
   Reasoning: The query is specifically asking about AI-related investments in the financial report. We don't need to analyze the entire report, but rather search for specific AI-related information. Vector similarity search would be more efficient in this case. The chat history doesn't provide relevant information for this query, so it's not considered in the rewrite.

5. Context:
   <Context>
   <ContextItem type='selectedContent' from='resource' entityId='content-2' title='Climate Change Report'>Recent studies indicate that global temperatures have risen by 1.1°C since pre-industrial times. The report emphasizes the urgent need for carbon emission reductions to mitigate further climate change impacts.</UserSelectedContent>
   </Context>

   Chat History:
   <ChatHistory>
   <ChatHistoryItem type={human}>What are the main causes of climate change?</ChatHistoryItem>
   <ChatHistoryItem type={ai}>The main causes of climate change include greenhouse gas emissions from burning fossil fuels, deforestation, and industrial processes. These human activities increase the concentration of heat-trapping gases in the atmosphere, leading to global warming.</ChatHistoryItem>
   </ChatHistory>

   Original query: "How do I reset my email password?"
   Rewritten query: "How do I reset my email password?"
   mentionedContext: []
   Reasoning: The query is unrelated to the provided context about climate change or the chat history. It's a standalone question about email password reset, so there's no need to use any of the given context. The query remains unchanged, and no context needs to be retrieved.
   `;
};

// TODO: build chatHistory and context related system prompt
export async function analyzeQueryAndContext(
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
): Promise<QueryAnalysis> {
  const { chatHistory, resources, notes, contentList, collections, modelName } = ctx.configSnapshot.configurable;
  const context: IContext = {
    resources,
    notes,
    contentList,
    collections,
  };

  ctx.ctxThis.emitEvent({ event: 'log', content: 'Analyzing query and context...' }, ctx.configSnapshot);

  // preprocess context for better extract mentioned context
  const preprocessedContext = preprocessContext(context);
  const maxContextTokens = ModelContextLimitMap[modelName] * MAX_CONTEXT_RATIO;
  const summarizedContext = summarizeContext(preprocessedContext, maxContextTokens);

  // summarize chat history
  const summarizedChatHistory = summarizeChatHistory(chatHistory || []);

  const systemPrompt = `## Role & Background
You are an advanced AI assistant specializing in query analysis and context extraction. Your primary task is to analyze the given query and available context. The chat history is provided for reference, but should not be the main focus of your analysis unless directly relevant to the current query.

Your tasks are to:
1. Rewrite the query to best represent the user's current intent, focusing primarily on the given context and the current query. Only consider chat history if it's directly relevant to understanding the current query.
2. Identify any specific context items (notes, resources, or selectedContent) mentioned in the query or directly relevant to it. If none are mentioned or relevant, leave this list empty.
3. For each identified context item, determine whether the entire content should be used or if partial content retrieval (e.g., through vector similarity search) is sufficient.
4. Determine the primary intent of the query.

## Examples

${buildAnalyzeQuerySystemPromptExamples()}

## Output Format
Output your analysis in the following format:
{
  "rewrittenQuery": "The rewritten query that best represents the user's intent",
  "mentionedContext": [
    {
      "type": "note" | "resource" | "selectedContent",
      "entityId": "ID of the mentioned item (if available)",
      "title": "Title of the mentioned item",
      "url": "URL of the mentioned item (if available)",
      "useWholeContent": true | false
    }
  ],
  "intent": "The primary intent of the query (e.g., SEARCH_QA, WRITING, READING_COMPREHENSION, or OTHER)",
  "confidence": 0.0 to 1.0,
  "reasoning": "A brief explanation of your analysis and rewriting process, including why you decided to use the whole content or not for each mentioned context item"
}`;

  const userMessage = `## User Query
${query}

## Available Context:
${summarizedContext}

## Recent Chat History (for reference):
${summarizedChatHistory}

Please analyze the query, focusing primarily on the current query and available context. Only consider the chat history if it's directly relevant to understanding the current query.`;

  const model = ctx.ctxThis.engine.chatModel({ temperature: 0.3 });
  // TODO: add property `useWholeContent` for check use whole content or use embedding similarity, 决定后续使用 context 时，是否截断
  const runnable = model.withStructuredOutput(
    z.object({
      rewrittenQuery: z.string(),
      mentionedContext: z.array(
        z.object({
          type: z.enum(['note', 'resource', 'selectedContent']),
          entityId: z.string().optional(),
          title: z.string(),
          url: z.string().optional(),
          useWholeContent: z.boolean(),
        }),
      ),
      intent: z.enum(['SEARCH_QA', 'WRITING', 'READING_COMPREHENSION', 'OTHER']),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    }),
  );

  const result = await runnable.invoke([new SystemMessage(systemPrompt), new HumanMessage(userMessage)]);

  ctx.ctxThis.engine.logger.log(`- Rewritten Query: ${result.rewrittenQuery}
    - Mentioned Context: ${safeStringifyJSON(result.mentionedContext)}
    - Intent: ${result.intent} (confidence: ${result.confidence})
    - Reasoning: ${result.reasoning}
    `);

  ctx.ctxThis.emitEvent({ event: 'log', content: `Analyzed query and context successfully!` }, ctx.configSnapshot);

  return {
    optimizedQuery: result.rewrittenQuery,
    mentionedContext: postprocessContext(result.mentionedContext, context),
    intent: result.intent,
    confidence: result.confidence,
    reasoning: result.reasoning,
  };
}

export const preprocessQuery = (
  query: string,
  ctx: { configSnapshot: SkillRunnableConfig; ctxThis: BaseSkill; state: GraphState; tplConfig: SkillTemplateConfig },
) => {
  const { modelName } = ctx.configSnapshot.configurable;
  const maxQueryTokens = ModelContextLimitMap[modelName] * MAX_QUERY_TOKENS_RATIO;

  return truncateText(query, maxQueryTokens);
};
