import { Runnable } from '@langchain/core/runnables';
import { ToolParams } from '@langchain/core/tools';
import { SkillEngine } from './engine';
import { StructuredTool } from '@langchain/core/tools';
import { StateGraphArgs } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { SkillContext, SkillInput } from '@refly/openapi-schema';

export abstract class BaseSkill extends StructuredTool {
  abstract graphState: StateGraphArgs<BaseSkillState>['channels'];

  constructor(protected engine: SkillEngine, params?: BaseToolParams) {
    super(params);
  }

  abstract toRunnable(): Runnable;

  async _call(
    input: typeof this.graphState,
    runManager?: CallbackManagerForToolRun,
    config?: RunnableConfig,
  ): Promise<string> {
    const runnable = this.toRunnable();

    return await runnable.invoke(input, config);
  }
}

export interface BaseToolParams extends ToolParams {
  engine: SkillEngine;
}

export interface BaseSkillState extends SkillInput, SkillContext {}

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
