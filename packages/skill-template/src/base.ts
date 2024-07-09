import { Runnable } from '@langchain/core/runnables';
import { ToolParams } from '@langchain/core/tools';
import deepmerge from '@fastify/deepmerge';
import { SkillEngine } from './engine';
import { StructuredTool } from '@langchain/core/tools';
import { StateGraphArgs } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { SkillContext, SkillInput, SkillMeta } from '@refly/openapi-schema';
import { EventEmitter } from 'node:stream';
import { SkillEvent } from '@refly/common-types';
import { genSkillEventSpanID } from '@refly/utils';

export abstract class BaseSkill extends StructuredTool {
  abstract displayName: Record<string, string>;
  abstract graphState: StateGraphArgs<BaseSkillState>['channels'];

  constructor(
    protected engine: SkillEngine,
    protected params?: BaseToolParams,
    protected defaultConfig?: SkillRunnableConfig,
  ) {
    super(params);
    this.defaultConfig ??= { configurable: {} };
  }

  /**
   * Convert this skill to a LangChain runnable.
   */
  abstract toRunnable(): Runnable;

  /**
   * Emit a skill event.
   */
  emitEvent(event: Omit<SkillEvent, 'skillName' | 'skillDisplayName'>, config?: SkillRunnableConfig) {
    const { emitter, selectedSkill, spanId } = config?.configurable || {};

    // Don't emit events for scheduler when skill is specified
    if (!emitter || (selectedSkill && this.name === 'scheduler')) {
      return;
    }

    const eventData: SkillEvent = {
      ...event,
      ...selectedSkill,
      spanId,
    };

    emitter?.emit(event.event, eventData);
  }

  async _call(
    input: typeof this.graphState,
    runManager?: CallbackManagerForToolRun,
    config?: SkillRunnableConfig,
  ): Promise<string> {
    config = deepmerge()(this.defaultConfig, config);

    // Ensure we get a new spanId for every skill call.
    config.configurable.spanId = genSkillEventSpanID();

    const runnable = this.toRunnable();

    this.emitEvent({ event: 'start' });

    const response = await runnable.invoke(input, config);

    this.emitEvent({ event: 'end' });

    return response;
  }
}

export interface BaseToolParams extends ToolParams {
  engine: SkillEngine;
}

export interface BaseSkillState extends SkillInput {}

export const baseStateGraphArgs = {
  query: {
    reducer: (left: string, right: string) => (right ? right : left || ''),
    default: () => '',
  },
  locale: {
    reducer: (left?: string, right?: string) => (right ? right : left || 'en'),
    default: () => 'en',
  },
};

export interface SkillEventMap {
  start: [data: SkillEvent];
  end: [data: SkillEvent];
  log: [data: SkillEvent];
  stream: [data: SkillEvent];
  structured_data: [data: SkillEvent];
}

export interface SkillInfo {
  skillId?: string;
  skillName: string;
  skillDisplayName: string;
}

export interface SkillRunnableMeta extends Record<string, unknown>, SkillInfo {}

export interface SkillRunnableConfig extends RunnableConfig {
  configurable?: SkillContext & {
    spanId?: string;
    uid?: string;
    selectedSkill?: SkillMeta;
    chatHistory?: string[];
    installedSkills?: SkillMeta[];
    emitter?: EventEmitter<SkillEventMap>;
  };
}
