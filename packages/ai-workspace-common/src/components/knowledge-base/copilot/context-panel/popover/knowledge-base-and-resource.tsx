import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchResult } from '@refly/openapi-schema';

export const KnowledgeBasePopover = () => {
  const fetchData = async (queryPayload) => {
    const res = await getClient().listCollections({
      query: {
        ...queryPayload,
      },
    });

    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.collectionId,
      title: item?.title,
      domain: 'collection',
    }));
    return { success: res?.data?.success, data };
  };

  return (
    <BasePopover
      content={<Content domain="collection" title="导入知识库" searchPlaceholder="搜索知识库" fetchData={fetchData} />}
    >
      <div className="context-tree-node-extra">
        <Button type="text" className="context-tree-node-extra-btn">
          <span>添加</span>
        </Button>
      </div>
    </BasePopover>
  );
};
