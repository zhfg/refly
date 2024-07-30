import { useEffect, useState } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Note } from '@refly/openapi-schema';
import { Button, List, Skeleton, Message as message } from '@arco-design/web-react';
import { IconBook, IconFile } from '@arco-design/web-react/icon';
import { CardBox } from '../card-box';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { NoteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/note-dropdown-menu';

import { EmptyDigestStatus } from '@refly-packages/ai-workspace-common/components/empty-digest-today-status';

import { LOCALE } from '@refly/common-types';
import './index.scss';

interface NoteListProps {}

const pageSize = 10;

export const NoteList = (props: NoteListProps) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scrollLoading, setScrollLoading] = useState(<Skeleton animation style={{ width: '100%' }}></Skeleton>);

  const [noteList, setNoteList] = useState<Note[]>([]);

  console.log('note list', noteList);
  console.log('note has more', hasMore);

  const fetchData = async (currentPage = 1) => {
    console.log('note page', currentPage);

    if (!hasMore) {
      setScrollLoading(<span>{t('knowledgeLibrary.archive.item.noMoreText')}</span>);
      return;
    }

    setScrollLoading(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Skeleton animation style={{ width: '100%' }}></Skeleton>
        <Skeleton animation style={{ width: '100%', marginTop: 24 }}></Skeleton>
      </div>,
    );

    const res = await getClient().listNotes({
      query: { page: currentPage, pageSize },
    });
    const listData: Note[] = res?.data?.data || [];

    if (listData.length < pageSize) {
      setHasMore(false);
    }

    setNoteList(noteList.concat(listData));
    setScrollLoading(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { jumpToNote } = useKnowledgeBaseJumpNewPath();

  if (noteList.length === 0) {
    return <EmptyDigestStatus />;
  }

  return (
    <>
      <List
        grid={{
          sm: 24,
          md: 12,
          lg: 8,
          xl: 6,
        }}
        className="workspace-list note-list"
        wrapperStyle={{ width: '100%' }}
        bordered={false}
        pagination={false}
        offsetBottom={50}
        dataSource={noteList}
        scrollLoading={scrollLoading}
        onReachBottom={(currentPage) => fetchData(currentPage)}
        render={(item: Note, key) => (
          <List.Item
            key={item?.noteId + key}
            style={{
              padding: '20px 0',
            }}
            className="knowledge-base-list-item-container"
            actionLayout="vertical"
            onClick={() => jumpToNote({ noteId: item.noteId })}
            actions={[
              <CardBox
                cardData={item}
                type="knowledge"
                cardIcon={<IconBook style={{ fontSize: '32px', strokeWidth: 3 }} />}
                onClick={() => jumpToNote({ noteId: item.noteId })}
              >
                <div className="flex items-center justify-between mt-6">
                  <div className="text-xs text-black/40">
                    {time(item.updatedAt, language as LOCALE)
                      .utc()
                      .fromNow()}
                  </div>
                  <div className="flex items-center">
                    {/* TODO: 添加事件 */}
                    <IconBook style={{ color: '#819292', cursor: 'pointer' }} />
                    <NoteDropdownMenu note={item} />
                  </div>
                </div>
              </CardBox>,
            ]}
          ></List.Item>
        )}
      />
      <Button onClick={() => fetchData()}>加载更多</Button>
    </>
  );
};
