import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { saveToKnowledgeBaseSkill } from '@refly-packages/ai-workspace-common/skills/skill-library/index';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

interface DispatchBody {
  type: 'hook' | 'state';
  name: string | 'saveToKnowledgeBase';
  body: any | 'onStart' | 'exit';
}

export const useDispatchAction = () => {
  // 统一写入 skillState，不影响其他 skill，不影响应用主状态
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const skills = [saveToKnowledgeBaseSkill];
  const runtime = getRuntime();

  // 过滤掉不符合当前 runtime 的 skill
  const filterSkillByRuntime = skills?.filter((skill) => skill?.runtimeScope?.includes(runtime)) || [];

  const dispatch = async <T>({ type, name, body }: DispatchBody) => {
    if (type === 'state') {
      let { skillState } = useKnowledgeBaseStore.getState();

      if (!skillState) {
        skillState = {};
      } else {
        skillState[name] = body;
      }

      knowledgeBaseStore.setSkillState(skillState);
    }
  };

  return {
    dispatch,
  };
};
