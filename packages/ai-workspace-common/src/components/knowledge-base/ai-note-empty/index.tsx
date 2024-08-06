import { Divider, Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';
import { useKnowledgeBaseStore } from '@refly/ai-workspace-common/stores/knowledge-base';
import './index.scss';

export const AINoteEmpty = () => {
  const { handleInitEmptyNote } = useAINote();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  return (
    <div className="ai-note-empty w-full mt-16 flex justify-center items-center overflow-auto">
      <div className="w-full h-full max-w-screen-lg">
        {/* <Title className="text-3xl font-bold ml-8 mb-8">暂无笔记</Title> */}
        <Button className="text-green-400 ml-8" icon={<IconPlus />} onClick={() => handleInitEmptyNote('New note')}>
          创建新笔记
        </Button>
        <Divider />
        <NoteList
          listGrid={
            knowledgeBaseStore.resourcePanelVisible
              ? {
                  sm: 48,
                  md: 24,
                  lg: 16,
                  xl: 12,
                }
              : null
          }
        />
      </div>
    </div>
  );
};
