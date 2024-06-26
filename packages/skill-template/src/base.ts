import { Runnable } from '@langchain/core/runnables';
import { ToolParams } from '@langchain/core/tools';
import { SkillEngine } from './engine';
import { StructuredTool } from '@langchain/core/tools';

export abstract class BaseSkill extends StructuredTool {
  constructor(protected engine: SkillEngine, params?: BaseToolParams) {
    super(params);
  }

  abstract toRunnable(): Runnable;
}

export interface BaseToolParams extends ToolParams {
  engine: SkillEngine;
}
