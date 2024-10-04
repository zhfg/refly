import {
  Icon,
  Resource,
  Note,
  Collection,
  SkillInvocationConfig,
  SkillMeta,
  SkillTemplateConfigSchema,
  SkillContextContentItem,
  SkillContextResourceItem,
  SkillContextNoteItem,
  SkillContextCollectionItem,
} from '@refly/openapi-schema';
import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { START, END, StateGraphArgs, StateGraph } from '@langchain/langgraph';
import { LOCALE } from '@refly-packages/common-types';
import { BaseSkill, BaseSkillState, SkillRunnableConfig, baseStateGraphArgs } from '../base';
import { ToolCall } from '@langchain/core/dist/messages/tool';

export interface SkillContextContentItemMetadata {
  domain: string;
  url?: string;
  title: string;
  entityId?: string;
}

export type SelectedContentDomain = 'resourceSelection' | 'noteSelection' | 'extensionWeblinkSelection';

export interface Chunk {
  content: string;
  metadata: {
    start: number;
    end: number;
  };
}

export interface QueryAnalysis {
  intent: 'WRITING' | 'READING_COMPREHENSION' | 'SEARCH_QA' | 'OTHER';
  confidence: number;
  reasoning: string;
  optimizedQuery: string;
  relevantContext: {
    type: 'message' | 'content' | 'resource' | 'note' | 'collection';
    id: string;
    content: string;
  }[];
}

export interface IContext {
  contentList: SkillContextContentItem[];
  resources: SkillContextResourceItem[];
  notes: SkillContextNoteItem[];
  collections: SkillContextCollectionItem[];
  messages?: BaseMessage[];
  locale?: string | LOCALE;
}

export interface GraphState extends BaseSkillState {
  /**
   * Accumulated messages.
   */
  messages: BaseMessage[];
  /**
   * Skill calls to run.
   */
  skillCalls: ToolCall[];
  contextualUserQuery: string; // 基于上下文改写 userQuery
}
