import { BaseSkill } from './base';
import { SkillEngine } from './engine';
import {
  KnowledgeBaseSearch,
  OnlineSearchSkill,
  SummarySkill,
  ResourceLabelerSkill,
  CreateFormalEmailSkill,
  CreateGitDiffCommitSkill,
  BasicSummarySkill,
  ExplainTermsSkill,
  TranslateSkill,
} from './templates';

export const createSkillInventory = (engine: SkillEngine): BaseSkill[] => {
  return [
    new KnowledgeBaseSearch(engine),
    new OnlineSearchSkill(engine),
    new SummarySkill(engine),
    new ResourceLabelerSkill(engine),
    new CreateFormalEmailSkill(engine),
    new CreateGitDiffCommitSkill(engine),
    new BasicSummarySkill(engine),
    new ExplainTermsSkill(engine),
    new TranslateSkill(engine),
  ];
};
