import { BaseSkill } from './base';
import { SkillEngine } from './engine';
import { OnlineSearchSkill, SummarySkill } from './templates';

export const createSkillInventory = (engine: SkillEngine): BaseSkill[] => {
  return [new OnlineSearchSkill(engine), new SummarySkill(engine)];
};
