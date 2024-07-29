import { Divider, Typography, Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';

const { Title, Paragraph } = Typography;

export const AINoteEmpty = (props: {}) => {
  const { handleInitEmptyNote } = useAINote();

  return (
    <div className="mx-4 mt-16 flex justify-center align-middle">
      <div className="w-full h-full max-w-screen-lg">
        {/* <Title className="text-3xl font-bold ml-8 mb-8">暂无笔记</Title> */}
        <Button className="text-green-400 ml-8" icon={<IconPlus />} onClick={() => handleInitEmptyNote('New note')}>
          创建新笔记
        </Button>
        <Divider />
        <Paragraph className="text-gray-500 ml-8">打开最近笔记</Paragraph>
        <NoteList />
      </div>
    </div>
  );
};
