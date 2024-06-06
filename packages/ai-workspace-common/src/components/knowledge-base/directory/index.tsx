import { LOCALE } from '@refly/constants';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

// styles
import './index.scss';
import { IconFile } from '@arco-design/web-react/icon';
import { Message as message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
// 类型
import { ResourceDetail } from '@refly/openapi-schema';
// 请求
import client from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// 组件
import { ResourceList } from '@refly-packages/ai-workspace-common/components/resource-list';

export const KnowledgeBaseDirectory = () => {
  const [isFetching, setIsFetching] = useState(false);
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const navigate = useNavigate();

  const [queryParams] = useSearchParams();
  const kbId = queryParams.get('kbId');
  const resId = queryParams.get('resId');

  const handleGetDetail = async (collectionId: string, resourceId: string) => {
    setIsFetching(true);
    try {
      const { data: newRes, error } = await client.getCollectionDetail({
        query: {
          collectionId,
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

      // 如果没有资源，则跳转到第一个资源
      if (!resourceId) {
        const firstResourceId = newRes?.data?.resources?.[0]?.resourceId;
        if (firstResourceId) {
          navigate(`/knowledge-base?kbId=${collectionId}&resId=${firstResourceId}`);
        }
      }
    } catch (err) {
      message.error('获取内容详情失败，请重新刷新试试');
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (kbId) {
      console.log('params kbId', kbId);
      handleGetDetail(kbId as string, resId as string);
    }
  }, [kbId, resId]);

  // 添加 collectionId
  const resources = knowledgeBaseStore?.currentKnowledgeBase?.resources?.map((item) => ({
    ...item,
    collectionId: kbId,
  }));

  return (
    <div className="knowledge-base-directory-container">
      <div className="knowledge-base-directory-intro">
        <div className="intro-body">
          <div className="intro-icon">
            <IconFile style={{ fontSize: 28, color: 'rgba(0, 0, 0, .5)' }} />
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
              <span>{knowledgeBaseStore?.currentKnowledgeBase?.resources?.length || 0} 个内容</span>
            </div>
          </div>
        </div>
        <div className="intro-menu">{/* <IconMore /> */}</div>
      </div>
      <div className="knowledge-base-directory-list-container">
        <ResourceList
          placeholder="搜索知识库..."
          isFetching={isFetching}
          resources={resources as ResourceDetail[]}
          handleItemClick={(item) => {
            navigate(`/knowledge-base?kbId=${item?.collectionId}&resId=${item?.resourceId}`);
          }}
        />
      </div>
    </div>
  );
};
