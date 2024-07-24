import { useEffect, useState } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Note } from '@refly/openapi-schema';
import { IconMore, IconBook } from '@arco-design/web-react/icon';

import { EmptyDigestStatus } from '@refly-packages/ai-workspace-common/components/empty-digest-today-status';

import { LOCALE } from '@refly/common-types';
import './index.scss';

interface NoteListProps {
  handleItemClick: (noteId: string) => void;
}

export const NoteList = (props: NoteListProps) => {
  const { i18n } = useTranslation();
  const language = i18n.languages?.[0];

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
    <div className="flex flex-wrap note-list">
      {noteList.length === 0 ? (
        <EmptyDigestStatus />
      ) : (
        noteList.map((item) => {
          return (
            <div
              className="p-4 m-3 border rounded-lg resource-item w-72 border-black/8 hover:bg-gray-500/10"
              key={item.noteId}
              onClick={() => {
                props.handleItemClick(item.noteId);
              }}
            >
              <div className="rounded-lg resource-img bg-emerald-200"></div>

              <div className="h-40 overflow-hidden">
                <div className="text-sm text-black/80 font-medium mb-1.5">{item.title}</div>
                <div className="text-xs text-black/50">{item?.content}</div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-xs text-black/40">
                  {time(item.updatedAt, language as LOCALE)
                    .utc()
                    .fromNow()}
                </div>
                <div>
                  {/* TODO: 添加事件 */}
                  <IconBook style={{ color: '#819292', cursor: 'pointer' }} />
                  <IconMore style={{ color: '#819292', marginLeft: '12px', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
