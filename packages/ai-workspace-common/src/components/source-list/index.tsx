import { Resource, Source } from '@refly/openapi-schema';
import { safeParseURL } from '@refly/utils/url';
import { List, Popover, Skeleton, Tag, Typography } from '@arco-design/web-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// 样式
import './index.scss';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { IconBook, IconBulb, IconCompass } from '@arco-design/web-react/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { Markdown } from '../markdown';
import { KnowledgeBaseTab, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SourceListModal } from './source-list-modal';
import { mapSourceToResource } from '@refly-packages/ai-workspace-common/utils/resource';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

interface SourceListProps {
  sources: Source[];
  isPendingFirstToken: boolean;
  isLastSession: boolean;
}

const SourceItem = ({ source, index }: { source: Source; index: number }) => {
  const domain = safeParseURL(source?.url || '');

  return (
    <Popover
      trigger={'hover'}
      color="#FCFCF9"
      className="source-item-popover-container"
      style={{ background: '#FCFCF9' }}
      position="bottom"
      getPopupContainer={getPopupContainer}
      content={<SourceDetailContent source={source} index={index} />}
    >
      <div className="flex relative flex-col text-xs rounded-lg source-list-item" key={index}>
        <div className="overflow-hidden font-medium whitespace-nowrap break-words text-ellipsis text-zinc-950">
          {index + 1} · {source?.title}
        </div>
        <div className="overflow-hidden flex-1 pl-2">
          <div className="overflow-hidden w-full whitespace-nowrap break-all text-ellipsis text-zinc-400">{domain}</div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex flex-none items-center">
            <img
              className="w-3 h-3"
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
      className="flex relative flex-col gap-2 px-3 py-3 text-xs rounded-lg source-list-item"
      onClick={() => {
        knowledgeBaseStore.updateTempConvResources(mappedResources as Resource[]);
        knowledgeBaseStore.updateSourceListModalVisible(true);
      }}
    >
      <div className="flex gap-2 items-center">
        <div className="overflow-hidden flex-1">
          <div className="overflow-hidden w-full font-medium whitespace-nowrap break-all text-ellipsis text-zinc-400 text-zinc-950">
            查看更多 {extraCnt} 来源
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center font-medium text-zinc-950">
        {sources?.map((item, index) => {
          const url = item?.url;
          const domain = safeParseURL(url || '');

          return (
            <img
              key={index}
              className="w-3 h-3"
              alt={url}
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const ResourceItem = (props: {
  item: Partial<Resource>;
  index: number;
  showUtil?: boolean;
  showDesc?: boolean;
}) => {
  const { item, index, showDesc = false } = props;
  const { handleAddTabWithResource } = useKnowledgeBaseTabs();
  const { jumpToReadResource } = useKnowledgeBaseJumpNewPath();
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
          <IconBook
            onClick={() => {
              jumpToReadResource({
                kbId: item?.collectionId,
                resId: item?.resourceId,
              });
            }}
          />
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
          <Markdown content={item?.content || ''} />
        </div>
      ) : null}
    </div>
  );
};

const SourceDetailContent = (props: { source: Source; index: number }) => {
  const { source, index } = props;
  const item: Partial<Resource> = {
    // collectionId: source?.metadata?.collectionId,
    resourceId: source?.metadata?.resourceId,
    data: {
      url: source?.url || '',
      title: source?.title,
    },
    content: source?.pageContent || '',
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
  const { isPendingFirstToken = false, isLastSession = false } = props;
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>);
  const { t } = useTranslation();

  return (props?.sources || []).length > 0 ? (
    <div className="session-source-content">
      <div className="session-source-list">
        {[
          props?.sources
            ?.slice(0, 3)
            .map((item, index) => <SourceItem key={index} index={index} source={item}></SourceItem>),
          props?.sources?.length > 3 ? (
            <ViewMoreItem
              key="view-more"
              sources={props?.sources || []}
              extraCnt={props?.sources?.slice(3)?.length || 0}
            />
          ) : null,
        ]}
      </div>
    </div>
  ) : null;
};
