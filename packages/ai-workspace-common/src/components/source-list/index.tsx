import { Resource, Source } from '@refly/openapi-schema';
import { getClientOrigin, safeParseURL } from '@refly/utils/url';
import { Skeleton, Tooltip } from '@arco-design/web-react';
import { Popover } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// 样式
import './index.scss';
import { IconBook, IconCompass, IconRight } from '@arco-design/web-react/icon';
import { Markdown } from '../markdown';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { mapSourceToResource } from '@refly-packages/ai-workspace-common/utils/resource';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { ClientChatMessage } from '@refly/common-types';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { TranslationWrapper } from '@refly-packages/ai-workspace-common/components/translation-wrapper';

interface SourceListProps {
  sources: Source[];
  query?: string;
}

const SourceItem = ({ source, index }: { source: Source; index: number }) => {
  const domain = safeParseURL(source?.url || '');
  const { jumpToResource, jumpToCanvas } = useJumpNewPath();
  const { i18n } = useTranslation();
  const currentUiLocale = i18n.language as 'en' | 'zh-CN';
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  // Handle click based on source type
  const handleClick = () => {
    if (source?.metadata?.sourceType === 'library') {
      if (source.metadata?.entityType === 'resource') {
        jumpToResource({ resId: source.metadata.entityId });
      } else if (source.metadata?.entityType === 'canvas') {
        jumpToCanvas({
          canvasId: source.metadata?.entityId,
          projectId: source?.metadata?.projectId,
        });
      }
    } else {
      // For web links, open in new tab
      window.open(source.url, '_blank');
    }
  };

  // Popover content with title, domain, icon and content
  const renderPopoverContent = () => (
    <div className="search-result-popover-content">
      {/* Title section */}
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-medium text-base m-0 break-words">{source?.title ?? ''}</h4>
      </div>

      {/* Domain section */}
      <div className="flex items-center gap-2 mb-2 px-4">
        <img
          className="w-4 h-4 flex-shrink-0"
          alt={domain}
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
        />
        <div className="text-zinc-400 text-sm break-all">{domain}</div>
      </div>

      {/* Content section */}
      <div className="content-body pt-0">{source.pageContent}</div>
    </div>
  );

  return (
    <Popover
      content={renderPopoverContent()}
      placement={isWeb ? 'left' : 'top'}
      trigger="hover"
      overlayClassName="search-result-popover"
    >
      <div
        className="flex relative flex-col text-xs rounded-lg source-list-item cursor-pointer hover:bg-gray-50 border border-solid border-black/10 transition-all p-2"
        key={index}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 w-full">
          {/* Left section with number and title */}
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="flex-shrink-0">{index + 1} ·</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-zinc-950">
              {source?.title ?? ''}
            </span>
          </div>

          {/* Right section with domain and icon */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-zinc-400 max-w-[120px]">
              {domain}
            </span>
            <img
              className="w-3 h-3 flex-shrink-0"
              alt={domain}
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
            />
          </div>
        </div>
      </div>
    </Popover>
  );
};

const ViewMoreItem = ({
  sources = [],
  extraCnt = 0,
  onClick,
}: {
  sources: Source[];
  extraCnt: number;
  onClick: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex relative flex-col flex-wrap gap-2 justify-start items-start px-3 py-3 text-xs rounded-lg cursor-pointer hover:bg-gray-50 source-list-item view-more-item border border-solid border-black/10 transition-all"
      onClick={() => {
        onClick?.();
      }}
    >
      <div className="overflow-hidden font-medium whitespace-nowrap break-all text-ellipsis text-zinc-500">
        {t('copilot.sourceListModal.moreSources', { count: extraCnt })} <IconRight />
      </div>
      {sources?.slice(sources.length - extraCnt)?.map((item, index) => {
        const url = item?.url;
        const domain = safeParseURL(url || '');

        return (
          <img
            key={index}
            className="flex-shrink-0 w-3 h-3"
            alt={url}
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
          />
        );
      })}
    </div>
  );
};

export const SourceList = (props: SourceListProps) => {
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>);

  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    updateSourceListDrawer: state.updateSourceListDrawer,
  }));

  const handleViewMore = () => {
    knowledgeBaseStore.updateSourceListDrawer({
      visible: true,
      sources: props?.sources,
      query: props?.query,
    });
  };

  return (props?.sources || []).length > 0 ? (
    <div className="session-source-content">
      <div className="session-source-list">
        {[
          props?.sources
            ?.slice(0, 3)
            .map((item, index) => <SourceItem key={index} index={index} source={item}></SourceItem>),
          props?.sources?.length > 3 ? (
            <ViewMoreItem
              onClick={handleViewMore}
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
