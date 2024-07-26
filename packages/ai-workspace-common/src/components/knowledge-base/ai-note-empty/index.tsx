import { useEffect, useState } from 'react';
import { Divider, Typography } from '@arco-design/web-react';
import { Note } from '@refly/openapi-schema';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

export const AINoteEmpty = (props: {}) => {
  const navigate = useNavigate();
  const { handleInitEmptyNote } = useAINote();

  const [noteList, setNoteList] = useState<Note[]>([]);
  const getNoteList = async () => {
    const res = await getClient().listNotes({
      query: {},
    });
    const listData: Note[] = res?.data?.data || [];
    setNoteList(listData);
  };

  useEffect(() => {
    getNoteList();
  }, []);

  return (
    <div className="mx-4 mt-16 flex justify-center align-middle">
      <div className="w-full h-full max-w-screen-lg">
        <Title className="text-3xl font-bold">暂无笔记</Title>
        <Paragraph className="text-green-400 hover:font-bold" onClick={() => handleInitEmptyNote('New note')}>
          创建新笔记
        </Paragraph>
        <Divider />
        <Paragraph>打开最近笔记</Paragraph>
        {noteList.map((item) => {
          return (
            <Text
              className="text-green-400 hover:font-bold"
              key={item.noteId}
              onClick={() => {
                navigate(`/knowledge-base?noteId=${item.noteId}`);
              }}
            >
              {item.title}
            </Text>
          );
        })}
      </div>
    </div>
  );
};
