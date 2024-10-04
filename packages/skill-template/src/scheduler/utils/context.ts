import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { IContext, SelectedContentDomain, SkillContextContentItemMetadata } from '../types';
import {
  Collection,
  Note,
  Resource,
  SkillContextCollectionItem,
  SkillContextNoteItem,
  SkillContextResourceItem,
} from '@refly-packages/openapi-schema';
import { z } from 'zod';

export const concatContext = (relevantContext: IContext) => {
  const { contentList, resources, notes } = relevantContext;

  let context = '';

  if (contentList.length > 0) {
    context += 'Following are the user selected content: \n';
    const concatContent = (content: string, from: SelectedContentDomain, title: string, id?: string, url?: string) => {
      return `<UserSelectedContent from={${from}} ${id ? `entityId={${id}}` : ''} title={${title}} ${
        url ? `weblinkUrl={${url}}` : ''
      }>${content}</UserSelectedContent>`;
    };

    context += contentList.map((c) => {
      const { metadata } = c;
      const { domain, entityId, title, url } = metadata as any as SkillContextContentItemMetadata;
      return concatContent(c?.content, domain as SelectedContentDomain, title, entityId, url);
    });

    context += '\n\n';
  }

  if (resources.length > 0) {
    context += 'Following are the knowledge base resources: \n';
    const concatResource = (id: string, title: string, content: string) => {
      return `<KnowledgeBaseResource entityId={${id}} title={${title}}>${content}</KnowledgeBaseResource>`;
    };

    context += resources
      .map((r) => concatResource(r.resource?.resourceId!, r.resource?.title!, r.resource?.content!))
      .join('\n');

    context += '\n\n';
  }

  if (notes.length > 0) {
    context += 'Following are the knowledge base notes: \n';
    const concatNote = (id: string, title: string, content: string) => {
      return `<KnowledgeBaseNote entityId={${id}} title={${title}}>${content}</KnowledgeBaseNote>`;
    };

    context += notes.map((n) => concatNote(n.note?.noteId!, n.note?.title!, n.note?.content!)).join('\n');
  }

  if (context?.length > 0) {
    context = `<Context>${context}</Context>`;
  }

  return context;
};

export async function extractRelevantContext(
  messages: BaseMessage[],
  context: {
    contentList: string[];
    resources: Resource[];
    notes: Note[];
    collections: Collection[];
  },
  intents: Array<{
    intent: string;
    confidence: number;
    reasoning: string;
  }>,
): Promise<string> {
  // Implement context extraction and compression logic
  /**
   * 1. 基于给定的聊天历史、上下文（contentList <string[]>、resources <Resource[]>、notes <Note[]>、collections <Collection[]>），还有当前的意图识别结果，提取出最相关的上下文
   * 2. 上下文在提取过程中可能涉及到向量相似度匹配，上下文裁剪或压缩等
   * 3. 根据模型的 token 窗口进行上下文提取，确保不会超出模型的 token 窗口同时是最相关的上下文
   * 3. 撰写 Prompt，调用 LLM
   */
  const { contentList, resources, notes, collections } = context;

  this.emitEvent({ event: 'log', content: 'Extracting relevant context...' }, this.configSnapshot);

  const getSystemPrompt =
    () => `You are an advanced AI assistant specializing in extracting relevant context for user queries. Your task is to analyze the given chat history, available context, and recognized intents to determine the most relevant information for answering the user's query.
  
  Guidelines:
  1. Analyze the chat history to understand the context of the conversation.
  2. Consider the recognized intents and their confidence scores when selecting relevant context.
  3. Prioritize recent and highly relevant information from the available context.
  4. Select a diverse range of context types (content, resources, notes, collections) if applicable.
  5. Limit the extracted context to the most relevant items to avoid information overload.
  6. If the available context doesn't seem relevant to the query, indicate that no relevant context was found.
  
  Output your response in the following JSON format:
  {
    "relevantContext": [
      {
        "type": "content | resource | note | collection",
        "id": "ID of the relevant item (if applicable)",
        "content": "Extracted relevant content or summary",
        "relevance": 0.0 to 1.0
      }
    ],
    "reasoning": "A brief explanation of your context selection"
  }`;

  const getUserMessage = () => `Chat History:
  ${this.summarizeChatHistory(messages)}
  
  Recognized Intents:
  ${intents.map((intent) => `- ${intent.intent} (confidence: ${intent.confidence})`).join('\n')}
  
  Available Context:
  - Content List: ${contentList.length} items
  - Resources: ${resources.length} items
  - Notes: ${notes.length} items
  - Collections: ${collections.length} items
  
  Please extract the most relevant context for answering the user's query.`;

  const model = this.engine.chatModel({ temperature: 0.3 });
  const runnable = model.withStructuredOutput(
    z.object({
      relevantContext: z.array(
        z.object({
          type: z.enum(['content', 'resource', 'note', 'collection']),
          id: z.string().optional(),
          content: z.string(),
          relevance: z.number().min(0).max(1),
        }),
      ),
      reasoning: z.string(),
    }),
  );

  const result = await runnable.invoke([new SystemMessage(getSystemPrompt()), new HumanMessage(getUserMessage())]);

  this.engine.logger.log(`Extracted ${result.relevantContext.length} relevant context items`);
  this.engine.logger.log(`Context extraction reasoning: ${result.reasoning}`);

  // Format the extracted context
  const formattedContext = result.relevantContext
    .map((item) => `[${item.type.toUpperCase()}${item.id ? ` ${item.id}` : ''}] ${item.content}`)
    .join('\n\n');

  return formattedContext;
}

export const summarizeContext = (context: IContext): string => {
  const { contentList, resources, notes, collections, messages } = context;

  const summarizeResources = (resources: SkillContextResourceItem[]) =>
    resources
      .map((r) => `- ${r.resource.resourceType}: "${r.resource.title}" (ID: ${r.resource.resourceId})`)
      .join('\n');

  const summarizeNotes = (notes: SkillContextNoteItem[]) =>
    notes.map((n) => `- Note: "${n.note.title}" (ID: ${n.note.noteId})`).join('\n');

  const summarizeCollections = (collections: SkillContextCollectionItem[]) =>
    collections.map((c) => `- Collection: "${c.collection.title}" (ID: ${c.collection.collectionId})`).join('\n');

  const summarizeMessages = (messages: BaseMessage[]) =>
    messages.map((m) => `- ${m._getType()}: ${(m.content as string)?.substring(0, 50)}...`).join('\n');

  return `Content List:
  ${contentList.map((c, i) => `- Content ${i + 1}: ${c.content.substring(0, 50)}...`).join('\n')}
  
  Resources:
  ${summarizeResources(resources)}
  
  Notes:
  ${summarizeNotes(notes)}
  
  Collections:
  ${summarizeCollections(collections)}
  
  Recent Messages:
  ${summarizeMessages(messages.slice(-5))}`;
};

export const summarizeChatHistory = (chatHistory: BaseMessage[]): string => {
  // Take the last 5 messages for context
  const recentMessages = chatHistory.slice(-5);
  return recentMessages.map((msg) => `${msg._getType()}: ${(msg.content as string)?.substring(0, 50)}...`).join('\n');
};
