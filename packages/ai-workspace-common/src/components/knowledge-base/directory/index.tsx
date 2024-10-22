import { LOCALE } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

// styles
import './index.scss';
import { IconFolder } from '@arco-design/web-react/icon';
import { Message as message } from '@arco-design/web-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useReloadListStateShallow } from '@refly-packages/ai-workspace-common/stores/reload-list-state';
// 类型
import { Resource, BindProjectResourcesRequest } from '@refly/openapi-schema';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// 组件
import { ResourceList } from '@refly-packages/ai-workspace-common/components/resource-list';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/delete-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';

export const KnowledgeBaseDirectory = (props: { small?: boolean }) => {
  const { t } = useTranslation();
  const [isFetching, setIsFetching] = useState(false);

  const reloadKnowledgeBaseState = useReloadListStateShallow((state) => ({
    reloadKnowledgeBaseList: state.reloadKnowledgeBaseList,
    reloadResourceDetail: state.reloadResourceDetail,
    setReloadKnowledgeBaseList: state.setReloadKnowledgeBaseList,
    setReloadResourceDetail: state.setReloadResourceDetail,
  }));
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    currentKnowledgeBase: state.currentKnowledgeBase,
    updateCurrentKnowledgeBase: state.updateCurrentKnowledgeBase,
  }));

  const { jumpToResource } = useKnowledgeBaseJumpNewPath();
  const { handleAddTab } = useKnowledgeBaseTabs();

  const [queryParams] = useSearchParams();
  const kbId = queryParams.get('kbId');
  const resId = queryParams.get('resId');
  const navigate = useNavigate();
  const introRef = useRef<HTMLDivElement>(null);
  const [introHeight, setIntroHeight] = useState(0);
  const { small } = props;

  const handleGetDetail = async (collectionId: string) => {
    setIsFetching(true);
    try {
      const { data: newRes, error } = await getClient().getProjectDetail({
        query: {
          projectId: collectionId,
        },
      });

      if (error) {
        throw error;
      }
      if (!newRes?.success) {
        throw new Error(newRes?.errMsg);
      }

      console.log('newRes', newRes);
      if (newRes.data) {
        knowledgeBaseStore.updateCurrentKnowledgeBase(newRes?.data);
      }
    } catch (err) {
      message.error(t('contentDetail.list.fetchErr'));
    }
    setIsFetching(false);
  };

  const updateIntroHeight = useCallback(() => {
    if (introRef.current) {
      const height = introRef.current.getBoundingClientRect().height;
      setIntroHeight(height);
    }
  }, []);

  useEffect(() => {
    updateIntroHeight();

    const resizeObserver = new ResizeObserver(updateIntroHeight);
    if (introRef.current) {
      resizeObserver.observe(introRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateIntroHeight]);

  useEffect(() => {
    if (kbId) {
      handleGetDetail(kbId);
    }
  }, [kbId]);

  useEffect(() => {
    // 如果没有资源，则跳转到第一个资源
    if (!resId) {
      const firstResourceId = knowledgeBaseStore.currentKnowledgeBase?.resources?.[0]?.resourceId;
      if (firstResourceId) {
        jumpToResource({
          resId: firstResourceId,
        });
      }
    }
  }, [kbId]);

  useEffect(() => {
    if (reloadKnowledgeBaseState.reloadKnowledgeBaseList) {
      reloadKnowledgeBaseState.setReloadKnowledgeBaseList(false);
      handleGetDetail(kbId);
    }
  }, [reloadKnowledgeBaseState.reloadKnowledgeBaseList]);

  // 添加 collectionId
  const resources = knowledgeBaseStore?.currentKnowledgeBase?.resources?.map((item) => ({
    ...item,
    collectionId: kbId,
  }));

  const handleDeleteKnowledgeBase = () => {
    /**删除知识库后重定向 */
    let url = '/knowledge-base';
    if (resId) {
      url = `/knowledge-base?resId=${resId}`;
    }
    navigate(url, { replace: true });
  };

  const handleDeleteResource = (item: BindProjectResourcesRequest) => {
    reloadKnowledgeBaseState.setReloadKnowledgeBaseList(true);
    if (resId === item?.resourceIds[0]) {
      reloadKnowledgeBaseState.setReloadResourceDetail(true);
    }
  };

  return (
    <div className="knowledge-base-directory-container" style={small ? { width: 72, minWidth: 72 } : {}}>
      <div className="knowledge-base-directory-intro" ref={introRef}>
        {small ? (
          <div className="knowledge-base-directory-intro-small">
            <IconFolder style={{ fontSize: 28, color: 'rgba(0, 0, 0, .5)', strokeWidth: 3 }} />
          </div>
        ) : (
          <>
            <div className="intro-body">
              <div className="intro-icon">
                <IconFolder style={{ fontSize: 28, color: 'rgba(0, 0, 0, .5)', strokeWidth: 3 }} />
              </div>
              <div className="intro-content">
                <div className="intro-title">{knowledgeBaseStore?.currentKnowledgeBase?.title}</div>
                <div className="intro-meta">
                  <span>
                    {time(knowledgeBaseStore?.currentKnowledgeBase?.updatedAt as string, LOCALE.EN)
                      .utc()
                      .fromNow()}
                  </span>
                  {' · '}
                  <span>
                    {t('knowledgeBase.directory.resourceCount', {
                      count: knowledgeBaseStore?.currentKnowledgeBase?.resources?.length || 0,
                    })}
                  </span>
                </div>
              </div>
            </div>
            {knowledgeBaseStore?.currentKnowledgeBase && (
              <DeleteDropdownMenu
                type="knowledgeBase"
                data={knowledgeBaseStore?.currentKnowledgeBase}
                postDeleteList={handleDeleteKnowledgeBase}
              />
            )}
          </>
        )}
      </div>

      <div
        className="knowledge-base-directory-list-container"
        style={{ height: `calc(100% - ${introHeight}px)`, minWidth: small ? 72 : 200 }}
      >
        <ResourceList
          placeholder={t('knowledgeBase.directory.searchPlaceholder')}
          isFetching={isFetching}
          resources={resources as Resource[]}
          collectionId={kbId}
          canDelete={true}
          showAdd={true}
          small={small}
          handleItemDelete={(item) => handleDeleteResource(item)}
          handleItemClick={(item) => {
            jumpToResource({
              resId: item?.resourceId,
            });
            handleAddTab({
              title: item?.title,
              key: item?.resourceId,
              content: '',
              resourceId: item?.resourceId,
            });
          }}
        />
      </div>
    </div>
  );
};
