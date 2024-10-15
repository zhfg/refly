import { BaseSkill } from './base';
import { SkillEngine } from './engine';
import {
  CreateFormalEmailSkill,
  CreateGitDiffCommitSkill,
  BasicSummarySkill,
  ExplainTermsSkill,
  TranslateSkill,
  FindRelatedContent,
  BrainstormIdeasSkill,
  ChangeToneSkill,
  ContinueWritingSkill,
  CreateArticleOutlineSkill,
  CreateBlogPostSkill,
  CreateSocialMediaPostSkill,
  ExtractActionItemSkill,
  FixSpellingAndGrammarIssuesSkill,
  ImproveWritingSkill,
  LanguageSimplificationSkill,
  MakeShorterSkill,
  MakeLongerSkill,
  ArxivSummarySkill,
  WebsiteSummarySkill,
} from './templates';

export const createSkillInventory = (engine: SkillEngine): BaseSkill[] => {
  return [
    new CreateFormalEmailSkill(engine),
    // new CreateGitDiffCommitSkill(engine),
    new BasicSummarySkill(engine),
    new ExplainTermsSkill(engine),
    new TranslateSkill(engine),
    // new FindRelatedContent(engine),
    new BrainstormIdeasSkill(engine),
    new ChangeToneSkill(engine),
    new ContinueWritingSkill(engine),
    new CreateArticleOutlineSkill(engine),
    new CreateBlogPostSkill(engine),
    new CreateSocialMediaPostSkill(engine),
    new ExtractActionItemSkill(engine),
    new FixSpellingAndGrammarIssuesSkill(engine),
    new ImproveWritingSkill(engine),
    new LanguageSimplificationSkill(engine),
    new MakeShorterSkill(engine),
    new MakeLongerSkill(engine),
    // new ArxivSummarySkill(engine),
    // new WebsiteSummarySkill(engine),
  ];
};
