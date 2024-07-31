import { Button } from '@arco-design/web-react';
import { BasePopover, Content } from './base';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchResult } from '@refly/openapi-schema';

export const ResourcePopover = () => {
  const fetchData = async (queryPayload) => {
    const res = await getClient().listResources({
      query: {
        ...queryPayload,
        resourceType: 'weblink',
      },
    });

    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.resourceId,
      title: item?.title,
      domain: 'resource',
      metadata: { collectionId: item?.collectionId, resourceType: 'weblink' },
    }));
    return { success: res?.data?.success, data };
  };

  return (
    <BasePopover
      content={
        <Content
          domain="resource"
          resourceType="weblink"
          title="导入资源"
          searchPlaceholder="搜索知识库"
          fetchData={fetchData}
        />
      }
    >
      <div className="context-tree-node-extra">
        <Button type="text" className="context-tree-node-extra-btn">
          <span>添加</span>
        </Button>
      </div>
    </BasePopover>
  );
};
