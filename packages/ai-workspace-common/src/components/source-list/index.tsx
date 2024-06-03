import { ResourceDetail, Source } from '@refly/openapi-schema';
import { safeParseURL } from '@refly-packages/ai-workspace-common/utils/url';
import { List, Popover, Skeleton, Tag, Typography } from '@arco-design/web-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// 样式
import './index.scss';
import { useNavigate } from 'react-router-dom';
import { IconBook, IconBulb, IconCompass } from '@arco-design/web-react/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { Markdown } from '../markdown';
import { KnowledgeBaseTab, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SourceListModal } from './source-list-modal';
import { mapSourceToResource } from '@refly-packages/ai-workspace-common/utils/resource';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';

interface SourceListProps {
  sources: Source[];
  isPending: boolean;
  isLastSession: boolean;
}

const SourceItem = ({ source, index }: { source: Source; index: number }) => {
  const domain = safeParseURL(source?.metadata?.source || '');

  return (
    <Popover
      trigger={'hover'}
      color="#FCFCF9"
      className="source-item-popover-container"
      style={{ background: '#FCFCF9' }}
      position="bottom"
      content={<SourceDetailContent source={source} index={index} />}
    >
      <div className="source-list-item relative text-xs py-3 px-3 rounded-lg flex flex-col gap-2" key={index}>
        <div className="font-medium text-zinc-950 text-ellipsis overflow-hidden whitespace-nowrap break-words">
          {source?.metadata?.title}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 overflow-hidden">
            <div className="text-ellipsis whitespace-nowrap break-all text-zinc-400 overflow-hidden w-full">
              {index + 1} - {domain}
            </div>
          </div>
          <div className="flex-none flex items-center">
            <img
              className="h-3 w-3"
              alt={domain}
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
            />
          </div>
        </div>
      </div>
    </Popover>
  );
};

const ViewMoreItem = ({ sources = [], extraCnt = 0 }: { sources: Source[]; extraCnt: number }) => {
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const mappedResources = mapSourceToResource(sources);

  return (
    <div
      className="source-list-item relative text-xs py-3 px-3 rounded-lg flex flex-col gap-2"
      onClick={() => {
        knowledgeBaseStore.updateTempConvResources(mappedResources as ResourceDetail[]);
        knowledgeBaseStore.updateSourceListModalVisible(true);
      }}
    >
      <div className="font-medium text-zinc-950 flex-wrap flex items-center gap-2">
        {sources?.map((item, index) => {
          const url = item?.metadata?.source;
          const domain = safeParseURL(url || '');

          return (
            <img
              key={index}
              className="h-3 w-3"
              alt={url}
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
            />
          );
        })}
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 overflow-hidden">
          <div className="font-medium text-zinc-950 text-ellipsis whitespace-nowrap break-all text-zinc-400 overflow-hidden w-full">
            查看更多 {extraCnt} 来源
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResourceItem = (props: {
  item: Partial<ResourceDetail>;
  index: number;
  showUtil?: boolean;
  showDesc?: boolean;
}) => {
  const { item, index, showDesc = false } = props;
  const { handleAddTabWithResource } = useKnowledgeBaseTabs();
  const navigate = useNavigate();

  return (
    <div className="knowledge-base-directory-item source-list-container" key={index}>
      <div className="knowledge-base-directory-site-intro">
        <div className="site-intro-icon">
          <img
            src={`https://www.google.com/s2/favicons?domain=${safeParseURL(item?.data?.url as string)}&sz=${32}`}
            alt={item?.data?.url}
          />
        </div>
        <div className="site-intro-content">
          <p className="site-intro-site-name">{item.data?.title}</p>
          <a className="site-intro-site-url" href={item.data?.url} target="_blank">
            {item.data?.url}
          </a>
        </div>
      </div>
      <div className="knowledge-base-directory-title">{item.data?.title}</div>
      <div className="knowledge-base-directory-action">
        <div className="action-markdown-content knowledge-base-directory-action-item">
          {/* <IconBook
            onClick={() => {
              navigate(`/knowledge-base?kbId=${item?.collectionId}&resId=${item?.resourceId}`);
            }}
          /> */}
        </div>
        <div className="action-external-origin-website knowledge-base-directory-action-item">
          <IconCompass
            onClick={() => {
              window.open(item?.data?.url, '_blank');
            }}
          />
        </div>
      </div>
      {showDesc ? (
        <div style={{ maxHeight: 300, overflowY: 'scroll', marginTop: 16 }}>
          <Markdown content={item?.description || ''} />
        </div>
      ) : null}
    </div>
  );
};

const SourceDetailContent = (props: { source: Source; index: number }) => {
  const { source, index } = props;
  const item: Partial<ResourceDetail> = {
    // collectionId: source?.metadata?.collectionId,
    resourceId: source?.metadata?.resourceId,
    data: {
      url: source?.metadata?.source || '',
      title: source?.metadata?.title,
    },
    description: source?.pageContent || '',
  };

  return (
    <Popover
      trigger={'hover'}
      // popupVisible={index === 1}
      color="#FCFCF9"
      style={{ background: '#FCFCF9' }}
      position="bottom"
      content={<SourceDetailContent source={source} index={index} />}
    >
      <ResourceItem index={index} item={item} showDesc />
    </Popover>
  );
};

export const SourceList = (props: SourceListProps) => {
  const { isPending = false, isLastSession = false } = props;
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>);
  const { t } = useTranslation();

  return (props?.sources || []).length > 0 ? (
    <div className="session-source-content">
      <div className="session-source-list">
        {props?.sources.length > 0 ? (
          [
            props?.sources
              ?.slice(0, 3)
              .map((item, index) => <SourceItem key={index} index={index} source={item}></SourceItem>),
            props?.sources?.length > 3 ? (
              <ViewMoreItem sources={props?.sources || []} extraCnt={props?.sources?.slice(3)?.length || 0} />
            ) : null,
          ]
        ) : (
          <>
            <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
            <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
            <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
            <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
          </>
        )}
      </div>
    </div>
  ) : isPending && isLastSession ? (
    <Skeleton animation></Skeleton>
  ) : null;
};
