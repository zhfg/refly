import { Resource, Source } from '@refly/openapi-schema';
import { getClientOrigin, safeParseURL } from '@refly/utils/url';
import { Popover, Skeleton, Tooltip } from '@arco-design/web-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// 样式
import './index.scss';
import { IconBook, IconCompass } from '@arco-design/web-react/icon';
import { Markdown } from '../markdown';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { mapSourceToResource } from '@refly-packages/ai-workspace-common/utils/resource';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { ClientChatMessage } from '@refly/common-types';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';

interface SourceListProps {
  sources: Source[];
  isPendingFirstToken: boolean;
  isLastSession: boolean;
  humanMessage?: Partial<ClientChatMessage>;
  aiMessage?: Partial<ClientChatMessage>;
}

const SourceItem = ({ source, index }: { source: Source; index: number }) => {
  const domain = safeParseURL(source?.url || '');

  return (
    <div className="flex relative flex-col text-xs rounded-lg source-list-item" key={index}>
      <div className="overflow-hidden font-medium whitespace-nowrap break-words text-ellipsis text-zinc-950">
        {index + 1} · {source?.title}
      </div>
      <div className="overflow-hidden flex-1 pl-2">
        <div className="overflow-hidden w-full whitespace-nowrap break-all text-ellipsis text-zinc-400">{domain}</div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex flex-none items-center">
          <img className="w-3 h-3" alt={domain} src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`} />
        </div>
      </div>
    </div>
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
      className="flex relative flex-col flex-wrap gap-2 justify-start items-start px-3 py-3 text-xs rounded-lg source-list-item view-more-item"
      onClick={() => {
        onClick?.();
      }}
    >
      <div className="overflow-hidden font-medium whitespace-nowrap break-all text-ellipsis text-zinc-950">
        {t('copilot.sourceListModal.moreSources', { count: extraCnt })}
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
  const { isPendingFirstToken = false, isLastSession = false } = props;
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>);

  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    updateSourceListDrawer: state.updateSourceListDrawer,
  }));

  const handleViewMore = () => {
    knowledgeBaseStore.updateSourceListDrawer({
      visible: true,
      sources: props?.sources,
      currentHumanMessage: props?.humanMessage as ClientChatMessage,
      currentAIMessage: props?.aiMessage as ClientChatMessage,
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
