import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { IconCloseCircle, IconLoading, IconRefresh } from '@arco-design/web-react/icon';
import { IconQuote } from '@refly-packages/ai-workspace-common/components/common/icon';

// 自定义样式
import './index.scss';
import { Skeleton, Message as message, Empty, Alert, Button, Tooltip } from '@arco-design/web-react';
import { useResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/resource';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Resource } from '@refly/openapi-schema';
import { memo, useEffect, useState } from 'react';
import { getClientOrigin, safeParseURL } from '@refly/utils/url';
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';

// content selector
import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import '@refly-packages/ai-workspace-common/modules/content-selector/styles/content-selector.scss';
import classNames from 'classnames';
import { useContentSelectorStoreShallow } from '@refly-packages/ai-workspace-common/modules/content-selector/stores/content-selector';
import { useTranslation } from 'react-i18next';

import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { useReferencesStoreShallow } from '@refly-packages/ai-workspace-common/stores/references';
import { ResourceIcon } from '@refly-packages/ai-workspace-common/components/common/resourceIcon';

export const ResourceView = (props: { resourceId: string; projectId?: string }) => {
  const { resourceId, projectId } = props;

  const { t } = useTranslation();

  const { deckSize, setDeckSize } = useReferencesStoreShallow((state) => ({
    deckSize: state.deckSize,
    setDeckSize: state.setDeckSize,
  }));

  const resourceStore = useResourceStoreShallow((state) => ({
    resource: state.resource,
    fetchResource: state.fetchResource,
    setCurrentResourceId: state.setCurrentResourceId,
    setResource: state.setResource,
    resetState: state.resetState,
  }));

  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    updateResource: state.updateResource,
  }));

  const resource = resourceStore.resource;
  const resourceDetail = resourceStore.resource?.data;

  useEffect(() => {
    return () => {
      resourceStore.resetState();
      knowledgeBaseStore.updateResource(null);
    };
  }, []);

  useEffect(() => {
    if (resourceId) {
      resourceStore.setCurrentResourceId(resourceId);
      resourceStore.fetchResource(resourceId);
    }
  }, [resourceId]);

  const { showContentSelector, scope } = useContentSelectorStoreShallow((state) => ({
    showContentSelector: state.showContentSelector,
    scope: state.scope,
  }));

  const baseUrl = getClientOrigin();
  const { initMessageListener, initContentSelectorElem } = useContentSelector(
    'knowledge-base-resource-content',
    'resourceSelection',
    {
      url: `${baseUrl}/resource/${resourceId}`,
    },
  );

  const reloadKnowledgeBaseState = useReloadListState();

  const [isReindexing, setIsReindexing] = useState(false);
  const handleReindexResource = async (resourceId: string) => {
    if (!resourceId || isReindexing) return;

    setIsReindexing(true);
    const { data, error } = await getClient().reindexResource({
      body: {
        resourceIds: [resourceId],
      },
    });

    if (error || !data?.success) {
      return;
    }

    if (data.data?.length) {
      const resource = data.data[0];
      resourceStore.setResource({ ...resourceDetail, indexStatus: resource.indexStatus });
    }
    setIsReindexing(false);
  };

  useEffect(() => {
    if (resourceId && reloadKnowledgeBaseState.reloadResourceDetail) {
      resourceStore.fetchResource(resourceId as string, true);
    }
    reloadKnowledgeBaseState.setReloadResourceDetail(false);
  }, [reloadKnowledgeBaseState.reloadResourceDetail]);

  const { handleInitContentSelectorListener } = useSelectedMark();

  // 初始化块选择
  useEffect(() => {
    setDeckSize(0);
    if (resource.loading) {
      return;
    }
    const remove = initMessageListener();
    handleInitContentSelectorListener();
    return () => {
      remove();
    };
  }, [resourceId, resource.loading]);

  // refresh every 2 seconds if resource is waiting to be parsed or indexed
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (['wait_parse', 'wait_index'].includes(resourceDetail?.indexStatus)) {
      intervalId = setInterval(() => {
        const reFetch = true;
        resourceStore.fetchResource(resourceId as string, reFetch);
      }, 2000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [resourceDetail?.indexStatus]);

  useEffect(() => {
    if (resourceDetail) {
      knowledgeBaseStore.updateResource(resourceDetail as Resource);
    }
  }, [resourceDetail]);

  const TopBar = () => {
    return (
      <div className="w-[90%] pt-2 pb-2 mx-auto flex justify-end items-center">
        <Button
          type="text"
          size="small"
          style={{ color: deckSize ? 'rgb(var(--primary-6))' : '#000' }}
          icon={<IconQuote />}
          onClick={() => {
            setDeckSize(deckSize ? 0 : 300);
          }}
        ></Button>
      </div>
    );
  };

  return (
    <div className="knowledge-base-resource-detail-container pt-[16px]">
      {resourceId ? (
        <div className="knowledge-base-resource-detail-body">
          {resource.loading ? (
            <div className="knowledge-base-resource-skeleton">
              <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
              <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
              <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
              <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            </div>
          ) : (
            <>
              <TopBar />
              <div className="knowledge-base-resource-meta">
                {['wait_parse', 'parse_failed', 'wait_index', 'index_failed'].includes(resourceDetail?.indexStatus) && (
                  <Alert
                    className={`${resourceDetail?.indexStatus}-alert`}
                    style={{ marginBottom: 16 }}
                    type={['wait_index', 'wait_parse'].includes(resourceDetail?.indexStatus) ? 'warning' : 'error'}
                    icon={
                      ['wait_index', 'wait_parse'].includes(resourceDetail?.indexStatus) ? (
                        <IconLoading style={{ color: 'rgb(202 138 4)' }} />
                      ) : (
                        <IconCloseCircle style={{ color: 'rgb(220 38 38)' }} />
                      )
                    }
                    content={
                      t(`resource.${resourceDetail?.indexStatus}`) +
                      (['wait_index', 'index_failed'].includes(resourceDetail?.indexStatus)
                        ? ': ' + t(`resource.${resourceDetail?.indexStatus}_tip`)
                        : '')
                    }
                    action={
                      ['index_failed', 'parse_failed'].includes(resourceDetail?.indexStatus) ? (
                        <Button
                          size="mini"
                          type="outline"
                          loading={isReindexing}
                          icon={<IconRefresh />}
                          className="retry-btn"
                          onClick={() => handleReindexResource(resourceId)}
                        >
                          {t('common.retry')}
                        </Button>
                      ) : null
                    }
                  />
                )}

                <div className="knowledge-base-directory-site-intro">
                  <div className="site-intro-icon">
                    <ResourceIcon
                      url={resourceDetail?.data?.url}
                      resourceType={resourceDetail?.resourceType}
                      size={24}
                    />
                  </div>
                  <div className="site-intro-content">
                    <p className="site-intro-site-name">{resourceDetail?.data?.title}</p>
                    <a className="site-intro-site-url" href={resourceDetail?.data?.url} target="_blank">
                      {resourceDetail?.data?.url}
                    </a>
                  </div>
                </div>
                {/* {resourceDetail && <LabelGroup entityId={resourceDetail.resourceId} entityType={'resource'} />} */}
              </div>
              <div
                className={classNames('knowledge-base-resource-content', {
                  'refly-selector-mode-active': showContentSelector,
                  'refly-block-selector-mode': scope === 'block',
                  'refly-inline-selector-mode': scope === 'inline',
                })}
              >
                {initContentSelectorElem()}
                <div className="knowledge-base-resource-content-title">{resourceDetail?.title}</div>
                <Markdown content={resourceDetail?.content || ''}></Markdown>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="knowledge-base-resource-detail-empty">
          <Empty description={t('common.empty')} />
        </div>
      )}
    </div>
  );
};
