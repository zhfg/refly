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
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    updateTempConvResources: state.updateTempConvResources,
    updateSourceListModalVisible: state.updateSourceListModalVisible,
  }));
  const mappedResources = mapSourceToResource(sources);
  const { t } = useTranslation();

  return (
    <div
      className="flex relative flex-col flex-wrap gap-2 justify-start items-start px-3 py-3 text-xs rounded-lg source-list-item view-more-item"
      onClick={() => {
        knowledgeBaseStore.updateTempConvResources(mappedResources as Resource[]);
        knowledgeBaseStore.updateSourceListModalVisible(true);
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

export const EntityItem = (props: { item: Source; index: number; showUtil?: boolean; showDesc?: boolean }) => {
  const { item, index, showDesc = false } = props;
  const { t } = useTranslation();
  const { jumpToResource, jumpToCanvas } = useJumpNewPath();

  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  return (
    <div className="knowledge-base-directory-item source-list-container" key={index}>
      <div className="knowledge-base-directory-site-intro">
        <div className="site-intro-icon">
          <img
            src={`https://www.google.com/s2/favicons?domain=${safeParseURL(item?.url as string)}&sz=${32}`}
            alt={item?.url}
          />
        </div>
        <div className="site-intro-content">
          <p className="site-intro-site-name">{item.title}</p>
          <a className="site-intro-site-url" href={item.url} target="_blank">
            {item.url}
          </a>
        </div>
      </div>
      <div className="knowledge-base-directory-title">{item.title}</div>
      <div className="knowledge-base-directory-action">
        {item?.metadata?.entityId ? (
          <Tooltip content={t('copilot.sourceListModal.openKnowledgeBaseLink')} getPopupContainer={getPopupContainer}>
            <div
              className="action-markdown-content knowledge-base-directory-action-item"
              onClick={() => {
                const extraParams = !isWeb ? { openNewTab: true, baseUrl: getClientOrigin() } : {};

                if (item?.metadata?.entityType === 'resource') {
                  jumpToResource({
                    resId: item?.metadata?.entityId,
                    ...extraParams,
                  });
                } else if (item?.metadata?.entityType === 'canvas') {
                  jumpToCanvas({
                    canvasId: item?.metadata?.entityId,
                    // @ts-ignore
                    projectId: item?.metadata?.projectId, // TODO: 这里需要补充 canvas 的 projectId
                    ...extraParams,
                  });
                }
              }}
            >
              <IconBook />
            </div>
          </Tooltip>
        ) : null}
        <Tooltip content={t('copilot.sourceListModal.openOriginWebsite')} getPopupContainer={getPopupContainer}>
          <div
            className="action-external-origin-website knowledge-base-directory-action-item"
            onClick={() => {
              window.open(item?.url, '_blank');
            }}
          >
            <IconCompass />
          </div>
        </Tooltip>
      </div>
      {showDesc ? (
        <div style={{ maxHeight: 300, overflowY: 'scroll', marginTop: 16 }}>
          <Markdown content={item?.pageContent || ''} />
        </div>
      ) : null}
    </div>
  );
};

const SourceDetailContent = (props: { source: Source; index: number }) => {
  const { source, index } = props;
  const item = source;

  return (
    <Popover
      trigger={'hover'}
      // popupVisible={index === 1}
      color="#FCFCF9"
      style={{ background: '#FCFCF9' }}
      position="bottom"
      content={<SourceDetailContent source={source} index={index} />}
    >
      <EntityItem index={index} item={item} showDesc />
    </Popover>
  );
};

export const SourceList = (props: SourceListProps) => {
  const { isPendingFirstToken = false, isLastSession = false } = props;
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>);

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
