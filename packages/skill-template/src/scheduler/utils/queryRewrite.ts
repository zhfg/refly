import { IContext, QueryAnalysis } from '../types';
import { z } from 'zod';

export async function analyzeQueryAndContext(query: string, context: IContext): Promise<Array<QueryAnalysis>> {
  const { contentList, resources, notes, collections, messages, locale } = context;

  this.emitEvent({ event: 'log', content: 'Analyzing query and context...' }, this.configSnapshot);

  const getSystemPrompt =
    () => `You are an advanced AI assistant specializing in query analysis, intent recognition, and context extraction. Analyze the given query and context to determine the user's atomic intents, optimize the query into atomic queries, and extract relevant context.
  
  Possible intents:
  1. SEARCH_QA: The user is asking a question that requires searching through given context or explicitly requests online search.
  2. WRITING: The user wants help with writing tasks such as composing emails, blog posts, optimizing expressions, continuing text, or summarizing.
  3. READING_COMPREHENSION: The user needs help understanding, summarizing, explaining, or translating given text.
  4. OTHER: The user's intent doesn't fit into the above categories.
  
  Guidelines:
  1. Analyze the query and all provided context carefully.
  2. Break down the query into atomic intents, where each intent corresponds to a single task or question.
  3. For each atomic intent, provide an optimized query that focuses solely on that intent.
  4. Extract the most relevant context items for each atomic intent.
  5. Provide a confidence score and reasoning for each identified intent.
  6. Consider the chat history and available context when analyzing the query.
  
  User's locale: ${locale}
  
  Here are some examples to illustrate the expected output:
  
  Example 1:
  Original Query: "Can you summarize the article about climate change and then help me write an email about its key points?"
  Output:
  {
    "analysis": [
      {
        "intent": "READING_COMPREHENSION",
        "confidence": 0.9,
        "reasoning": "The user explicitly asks for a summary of an article.",
        "optimizedQuery": "Summarize the article about climate change",
        "relevantContext": [
          {
            "type": "resource",
            "id": "climate_change_article_id",
            "content": "Article about climate change impacts and mitigation strategies"
          }
        ]
      },
      {
        "intent": "WRITING",
        "confidence": 0.85,
        "reasoning": "The user requests help in writing an email based on the summary.",
        "optimizedQuery": "Write an email about the key points of the climate change article summary",
        "relevantContext": []
      }
    ]
  }
  
  Example 2:
  Original Query: "What are the main characters in 'To Kill a Mockingbird' and can you help me write a short essay about the theme of racial injustice in the book?"
  Output:
  {
    "analysis": [
      {
        "intent": "SEARCH_QA",
        "confidence": 0.95,
        "reasoning": "The user is asking for specific information about the book's characters.",
        "optimizedQuery": "What are the main characters in 'To Kill a Mockingbird'?",
        "relevantContext": [
          {
            "type": "resource",
            "id": "to_kill_a_mockingbird_book_id",
            "content": "Novel 'To Kill a Mockingbird' by Harper Lee"
          }
        ]
      },
      {
        "intent": "WRITING",
        "confidence": 0.9,
        "reasoning": "The user requests assistance in writing an essay about a specific theme in the book.",
        "optimizedQuery": "Write a short essay about the theme of racial injustice in 'To Kill a Mockingbird'",
        "relevantContext": [
          {
            "type": "resource",
            "id": "to_kill_a_mockingbird_book_id",
            "content": "Novel 'To Kill a Mockingbird' by Harper Lee"
          }
        ]
      }
    ]
  }
  
  Output your response in the following JSON format:
  {
    "analysis": [
      {
        "intent": "SEARCH_QA | WRITING | READING_COMPREHENSION | OTHER",
        "confidence": 0.0 to 1.0,
        "reasoning": "A brief explanation of your reasoning",
        "optimizedQuery": "An atomic, optimized version of the original query",
        "relevantContext": [
          {
            "type": "content | resource | note | collection | message",
            "id": "ID of the relevant context item",
            "content": "Brief summary or extract of the relevant content"
          }
        ]
      }
    ]
  }`;

  const getUserMessage = () => `Query: ${query}
  
  Context Summary:
  ${this.summarizeContext({ contentList, resources, notes, collections, messages, locale })}
  
  Please analyze the query and context to determine the user's intent, optimize the query, and extract relevant context.`;

  const model = this.engine.chatModel({ temperature: 0.1 });
  const runnable = model.withStructuredOutput(
    z.object({
      analysis: z.array(
        z.object({
          intent: z.enum(['SEARCH_QA', 'WRITING', 'READING_COMPREHENSION', 'OTHER']),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          optimizedQuery: z.string(),
          relevantContext: z.array(
            z.object({
              type: z.enum(['content', 'resource', 'note', 'collection', 'message']),
              id: z.string(),
              content: z.string(),
            }),
          ),
        }),
      ),
    }),
  );

  const result = await runnable.invoke([new SystemMessage(getSystemPrompt()), new HumanMessage(getUserMessage())]);

  result.analysis.forEach((item, index) => {
    this.engine.logger.log(`Analysis ${index + 1}:`);
    this.engine.logger.log(`Intent: ${item.intent} (confidence: ${item.confidence})`);
    this.engine.logger.log(`Reasoning: ${item.reasoning}`);
    this.engine.logger.log(`Optimized Query: ${item.optimizedQuery}`);
    this.engine.logger.log(`Relevant Context: ${JSON.stringify(item.relevantContext)}`);

    this.emitEvent({ event: 'log', content: `Analysis ${index + 1}:` }, this.configSnapshot);
    this.emitEvent(
      { event: 'log', content: `Intent: ${item.intent} (confidence: ${item.confidence})` },
      this.configSnapshot,
    );
    this.emitEvent({ event: 'log', content: `Reasoning: ${item.reasoning}` }, this.configSnapshot);
    this.emitEvent({ event: 'log', content: `Optimized Query: ${item.optimizedQuery}` }, this.configSnapshot);
    this.emitEvent(
      { event: 'log', content: `Relevant Context: ${JSON.stringify(item.relevantContext)}` },
      this.configSnapshot,
    );
  });

  return result.analysis as QueryAnalysis[];
}
