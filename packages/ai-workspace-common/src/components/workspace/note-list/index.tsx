import { useEffect, useState } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Note } from '@refly/openapi-schema';
import { IconBook, IconFile } from '@arco-design/web-react/icon';
import { CardBox } from '../card-box';
import { NoteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/note-dropdown-menu';

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
            <CardBox
              key={item.noteId}
              onClick={() => {
                props.handleItemClick(item.noteId);
              }}
            >

              <div className="h-40 overflow-hidden">
                <div className="flex items-center mb-1.5">
                  <div className="icon-box flex items-center justify-center rounded-lg resource-icon shrink-0 border-black/8">
                    <IconFile style={{ fontSize: '32px'}} />
                  </div>
                  <div className="note-title flex items-center text-sm text-black/80 font-medium h-10">{item.title}</div>
                </div>
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
                  <NoteDropdownMenu note={item} />
                </div>
              </div>
            </CardBox>
          );
        })
      )}
    </div>
  );
};
