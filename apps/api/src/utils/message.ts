import { SkillEvent } from '@refly/common-types';
import { Prisma, TokenUsage } from '@prisma/client';
import { SkillMeta, TokenUsageItem, User } from '@refly/openapi-schema';
import { SkillRunnableMeta } from '@refly/skill-template';
import { AIMessageChunk } from '@langchain/core/dist/messages';
import { ToolCall } from '@langchain/core/dist/messages/tool';
import { aggregateTokenUsage, pick } from '@refly/utils';

interface MessageData {
  skillMeta: SkillMeta;
  logs: string[];
  content: string;
  structuredData: Record<string, unknown>;
  errors: string[];
  toolCalls: ToolCall[];
  usageItems: TokenUsageItem[];
}

export class MessageAggregator {
  /**
   * Span ID list, in the order of sending
   */
  private spanIdList: string[] = [];

  /**
   * Message data, with key being the spanId and value being the message
   */
  private data: Record<string, MessageData> = {};

  /**
   * Whether the skill invocation is aborted
   */
  private aborted: boolean = false;

  private getOrInitData(event: Pick<SkillEvent, 'spanId' | 'skillMeta'>): MessageData {
    const { spanId, skillMeta } = event;

    const messageData = this.data[spanId];
    if (messageData) {
      return messageData;
    }

    this.spanIdList.push(spanId);

    return {
      skillMeta,
      logs: [],
      content: '',
      structuredData: {},
      errors: [],
      toolCalls: [],
      usageItems: [],
    };
  }

  abort() {
    this.aborted = true;
  }

  addSkillEvent(event: SkillEvent) {
    if (this.aborted) {
      return;
    }

    const msg: MessageData = this.getOrInitData(event);
    switch (event.event) {
      case 'log':
        msg.logs.push(event.content);
        break;
      case 'structured_data':
        if (event.structuredDataKey) {
          msg.structuredData[event.structuredDataKey] = event.content;
        }
        break;
      case 'error':
        msg.errors.push(event.content);
        break;
    }
    this.data[event.spanId] = msg;
  }

  handleStreamEndEvent(meta: SkillRunnableMeta, chunk: AIMessageChunk, usage: TokenUsage) {
    if (this.aborted) {
      return;
    }

    const msg = this.getOrInitData({ skillMeta: meta, spanId: meta.spanId });

    msg.content += chunk.content.toString();
    msg.toolCalls.push(...chunk.tool_calls);
    msg.usageItems.push(
      pick(usage, ['tier', 'modelName', 'modelProvider', 'inputTokens', 'outputTokens']),
    );

    this.data[meta.spanId] = msg;
  }

  getMessages(param: {
    user: User;
    convId: string;
    jobId: string;
  }): Prisma.ChatMessageCreateManyInput[] {
    const { user, convId, jobId } = param;

    return this.spanIdList.map((spanId) => {
      const { skillMeta, content, logs, structuredData, errors, toolCalls, usageItems } =
        this.data[spanId];
      const aggregatedUsage = aggregateTokenUsage(usageItems);

      return {
        type: 'ai',
        content,
        skillMeta: JSON.stringify(skillMeta),
        logs: JSON.stringify(logs),
        structuredData: JSON.stringify(structuredData),
        errors: JSON.stringify(errors),
        toolCalls: JSON.stringify(toolCalls),
        tokenUsage: JSON.stringify(aggregatedUsage),
        uid: user.uid,
        convId,
        jobId,
        spanId,
      };
    });
  }
}
