import { BaseSkill } from './base';
import { SkillEngine } from './engine';
import {
  KnowledgeBaseSearch,
  OnlineSearchSkill,
  SummarySkill,
  ResourceLabelerSkill,
  CreateFormalEmailSkill,
  CreateGitDiffCommitSkill,
} from './templates';

export const createSkillInventory = (engine: SkillEngine): BaseSkill[] => {
  return [
    new KnowledgeBaseSearch(engine),
    new OnlineSearchSkill(engine),
    new SummarySkill(engine),
    new ResourceLabelerSkill(engine),
    new CreateFormalEmailSkill(engine),
    new CreateGitDiffCommitSkill(engine),
  ];
};
