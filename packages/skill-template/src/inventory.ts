import { BaseSkill } from './base';
import SummarySkill from './templates/summary';
import OnlineSearchSkill from './templates/online-search';
import { SkillEngine } from './engine';
import { Runnable } from '@langchain/core/runnables';

interface InventoryItem {
  name: string;
  skillClass: new (engine: SkillEngine) => BaseSkill;
  // TODO: 补充元数据
}

export const inventory: InventoryItem[] = [
  {
    name: SummarySkill.name,
    skillClass: SummarySkill,
  },
  {
    name: OnlineSearchSkill.name,
    skillClass: OnlineSearchSkill,
  },
];

export type SkillName = (typeof inventory)[number]['name'];

export const getRunnable = (engine: SkillEngine, name: SkillName): Runnable => {
  const item = inventory.find((i) => i.name === name);
  if (!item) {
    throw new Error(`skill not found: ${name}`);
  }
  const Constructor = item.skillClass;

  return new Constructor(engine).toRunnable();
};
