import { Runnable } from '@langchain/core/runnables';
import { ToolParams } from '@langchain/core/tools';
import { SkillEngine } from './engine';
import { StructuredTool } from '@langchain/core/tools';
import { StateGraphArgs } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { SkillContext, SkillInput, SkillMeta } from '@refly/openapi-schema';
import { EventEmitter } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { SkillEvent } from '@refly/common-types';

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
  emitEvent(data: Partial<SkillEvent>, config: SkillRunnableConfig) {
    const { emitter, selectedSkill, spanId } = config?.configurable || {};

    if (!emitter) {
      return;
    }

    const eventData: SkillEvent = {
      event: data.event!,
      spanId,
      ...selectedSkill,
      ...data,
    };

    emitter.emit(data.event, eventData);
  }

  async _call(
    input: typeof this.graphState,
    runManager?: CallbackManagerForToolRun,
    config?: SkillRunnableConfig,
  ): Promise<string> {
    config ??= { configurable: {} };

    // Ensure selectedSkill is not empty.
    config.configurable.selectedSkill ??= {
      skillName: this.name,
      skillDisplayName: this.displayName[config.configurable.locale || 'en'],
    };

    // Ensure we get a new spanId for every skill call.
    config.configurable.spanId = randomUUID();

    const runnable = this.toRunnable();

    this.emitEvent({ event: 'start' }, config);

    const response = await runnable.invoke(input, {
      ...config,
      metadata: {
        ...config.metadata,
        ...config.configurable.selectedSkill,
        spanId: config.configurable.spanId,
      },
    });

    this.emitEvent({ event: 'end' }, config);

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

export interface SkillRunnableMeta extends Record<string, unknown>, SkillMeta {
  spanId: string;
}

export interface SkillRunnableConfig extends RunnableConfig {
  configurable?: SkillContext & {
    spanId?: string;
    uid?: string;
    selectedSkill?: SkillMeta;
    chatHistory?: string[];
    installedSkills?: SkillMeta[];
    emitter?: EventEmitter<SkillEventMap>;
  };
  metadata?: SkillRunnableMeta;
}
