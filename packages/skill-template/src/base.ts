import { Runnable } from '@langchain/core/runnables';
import { ToolParams } from '@langchain/core/tools';
import { SkillEngine } from './engine';
import { StructuredTool } from '@langchain/core/tools';
import { StateGraphArgs } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { SkillContext, SkillInput } from '@refly/openapi-schema';
import { EventEmitter } from 'node:stream';

export abstract class BaseSkill extends StructuredTool {
  config?: SkillRunnableConfig;

  abstract displayName: Record<string, string>;
  abstract graphState: StateGraphArgs<BaseSkillState>['channels'];

  constructor(protected engine: SkillEngine, params?: BaseToolParams) {
    super(params);
  }

  abstract toRunnable(): Runnable;

  emitEvent(event: keyof SkillEventMap, msg?: string) {
    const { locale = 'en', emitter } = this.config?.configurable || {};
    if (emitter) {
      emitter.emit(event, {
        name: this.name,
        showName: this.displayName[locale],
        msg,
      });
    }
  }

  async _call(
    input: typeof this.graphState,
    runManager?: CallbackManagerForToolRun,
    config?: SkillRunnableConfig,
  ): Promise<string> {
    this.config = config;
    const runnable = this.toRunnable();

    this.emitEvent('on_skill_start');
    const response = await runnable.invoke(input, config);
    this.emitEvent('on_skill_end');

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

interface SkillEventData {
  name: string;
  showName: string;
  skillId?: string;
  msg: string;
}

export interface SkillEventMap {
  on_skill_start: [data: SkillEventData];
  on_skill_stream: [data: SkillEventData];
  on_skill_end: [data: SkillEventData];
}

export interface SkillRunnableConfig extends RunnableConfig {
  configurable: SkillContext & {
    uid: string;
    selectedSkill?: string;
    chatHistory?: string[];
    installedSkills?: string[];
    emitter: EventEmitter<SkillEventMap>;
  };
}
