import { initialCheckedKeys } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/utils';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useDynamicInitContextPanelState = () => {
  const { currentKnowledgeBase, currentCanvas: currentNote, currentResource } = useCopilotContextState();
  const { setCheckedKeys, envContextInitMap } = useContextPanelStore();
  const [searchParams] = useSearchParams();

  const noteId = searchParams.get('noteId');
  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');

  /**
   * Rules:
   *
   * 1. 从未打开过 contextPanel，根据当前选中的页面动态初始化 「环境上下文」
   * 2. 打开了新的环境上下文，环境上下文要变化
   * 3. 如果用户打开了 contextPanel，则需要记录 「环境上下文」是否被用户手动修改，如果手动修改过则遵从手动修改
   */
  useEffect(() => {
    const { checkedKeys } = useContextPanelStore.getState();
    // 动态添加 checkedKeys
    const needInitialCheckedKeys = initialCheckedKeys?.filter((key) => {
      if (key.startsWith('currentPage-collection')) {
        if (!kbId || envContextInitMap?.collection || !currentKnowledgeBase) {
          return false;
        }

        return true;
      }

      if (key.startsWith('currentPage-resource')) {
        if (!resId || envContextInitMap?.resource || !currentResource) {
          return false;
        }

        return true;
      }

      if (key.startsWith('currentPage-note')) {
        if (!noteId || envContextInitMap?.note || !currentNote) {
          return false;
        }

        return true;
      }

      return true;
    });

    // 检查是否 checkedKeys 中存在
    let newCheckedKeys = checkedKeys;
    if (needInitialCheckedKeys?.length > 0) {
      // 增加的 key
      const needAddedCheckedKeys = needInitialCheckedKeys?.filter((key) => {
        if (!checkedKeys?.includes(key)) {
          return true;
        }

        return false;
      });
      // 减少的 key
      const afterRmovedCheckedKeys = checkedKeys?.filter((key) => {
        if (!needInitialCheckedKeys?.includes(key) && initialCheckedKeys?.includes(key)) {
          return false;
        }

        return true;
      });

      setCheckedKeys([...afterRmovedCheckedKeys, ...needAddedCheckedKeys]);
    }
  }, [noteId, resId, kbId, currentKnowledgeBase, currentNote, currentResource]);
};
