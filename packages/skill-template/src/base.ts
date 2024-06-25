import { Runnable } from '@langchain/core/runnables';
import { ToolParams } from '@langchain/core/tools';
import SkillEngine from './engine';

export abstract class BaseSkill {
  constructor(protected engine: SkillEngine) {}

  abstract toRunnable(): Runnable;
}

export interface BaseToolParams extends ToolParams {
  engine: SkillEngine;
}
