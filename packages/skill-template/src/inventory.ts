import { BaseSkill } from './base';
import SummarySkill from 'src/templates/summary';
import SearchAndAddResourceSkill from 'src/templates/search-and-add-resource';

interface InventoryItem {
  name: string;
  skillClass: typeof BaseSkill;
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
