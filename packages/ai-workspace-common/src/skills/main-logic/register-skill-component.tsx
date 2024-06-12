import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { saveToKnowledgeBaseSkill } from '@refly-packages/ai-workspace-common/skills/skill-library/index';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';

interface BaseSingleSkillState {}

interface ModalSingleSkillState extends BaseSingleSkillState {
  modalVisible: boolean;
}

export const RegisterSkillComponent = () => {
  const knowledgeBaseStore = useKnowledgeBaseStore();

  const skillState = knowledgeBaseStore?.skillState;
  const skills = [saveToKnowledgeBaseSkill];
  const runtime = getRuntime();

  // 过滤掉不符合当前 runtime 的 skill
  const filterSkillByRuntime = skills?.filter((skill) => skill?.runtimeScope?.includes(runtime)) || [];
  // 过滤出当前需要展示为 Modal 的 Skill
  const filterModalSkill = filterSkillByRuntime?.filter((skill) => skill?.component?.position === 'modal') || [];

  return (
    <>
      {filterModalSkill?.map((skill, index) => {
        const Component = skill?.component?.Component;
        return (skillState?.[skill?.name] as ModalSingleSkillState)?.modalVisible ? <Component /> : null;
      })}
    </>
  );
};
