import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { saveToKnowledgeBaseSkill } from '@refly-packages/ai-workspace-common/skills/skill-library/index';

export const useGetSkills = () => {
  const skills = [saveToKnowledgeBaseSkill];
  const runtime = getRuntime();

  // 过滤掉不符合当前 runtime 的 skill
  const filterSkillByRuntime = skills?.filter((skill) => skill?.runtimeScope?.includes(runtime)) || [];
  // 过滤出当前需要展示为 Modal 的 Skill

  return [filterSkillByRuntime];
};
