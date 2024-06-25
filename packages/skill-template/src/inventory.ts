import { BaseSkill } from './base';
import SummarySkill from './templates/summary';
import SearchAndAddResourceSkill from './templates/search-and-add-resource';
import { SkillEngine } from './engine';

interface InventoryItem {
  name: string;
  skillClass: new (engine: SkillEngine) => BaseSkill;
}

export const inventory: InventoryItem[] = [
  {
    name: 'summary',
    skillClass: SummarySkill,
  },
  {
    name: 'search-and-add-resource',
    skillClass: SearchAndAddResourceSkill,
  },
];

export const getRunnable = (engine: SkillEngine, name: string) => {
  const item = inventory.find((i) => i.name === name);
  if (!item) {
    throw new Error(`skill not found: ${name}`);
  }
  const Constructor = item.skillClass;

  return new Constructor(engine).toRunnable();
};
