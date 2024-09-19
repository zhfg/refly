import { useEffect } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Note } from '@refly/openapi-schema';
import { List, Empty } from '@arco-design/web-react';
import { PiNotepad } from 'react-icons/pi';
import { NoteCard } from '@refly-packages/ai-workspace-common/components/workspace/note-list/note-card';
import { ScrollLoading } from '../scroll-loading';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/delete-dropdown-menu';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

import { LOCALE } from '@refly/common-types';
import './index.scss';
interface NoteListProps {
  listGrid?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export const NoteList = (props: NoteListProps) => {
  const { listGrid } = props;
  const { i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const { dataList, setDataList, loadMore, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listNotes({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    loadMore();
  }, []);

  const { jumpToNote } = useKnowledgeBaseJumpNewPath();

  if (dataList.length === 0 && !isRequesting) {
    return <Empty />;
  }

  return (
    <List
      loading={isRequesting}
      grid={
        listGrid || {
          sm: 24,
          md: 12,
          lg: 8,
          xl: 6,
        }
      }
      className="workspace-list note-list"
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: Note, key) => (
        <List.Item
          key={item?.noteId + key}
          style={{
            padding: '0',
            width: '100%',
          }}
          className="knowledge-base-list-item-container"
          actionLayout="vertical"
          actions={[
            <NoteCard
              cardData={item}
              index={key}
              cardIcon={<PiNotepad style={{ fontSize: '32px' }} />}
              onClick={() => jumpToNote({ noteId: item.noteId })}
            >
              <div className="flex items-center justify-between mt-6">
                <div className="text-xs text-black/40">
                  {time(item.updatedAt, language as LOCALE)
                    .utc()
                    .fromNow()}
                </div>
                <div className="flex items-center">
                  <DeleteDropdownMenu
                    type="note"
                    data={item}
                    postDeleteList={(note: Note) => setDataList(dataList.filter((n) => n.noteId !== note.noteId))}
                    getPopupContainer={() => document.getElementById(`note-${key}`) as HTMLElement}
                  />
                </div>
              </div>
            </NoteCard>,
          ]}
        ></List.Item>
      )}
    />
  );
};
