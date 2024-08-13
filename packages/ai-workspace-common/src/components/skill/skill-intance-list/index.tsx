import { useEffect } from 'react';

// components
import { SkillItem } from '@refly/ai-workspace-common/components/skill/skill-management/skill-item';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

import { SkillInstance } from '@refly/openapi-schema';

import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { List, Empty } from '@arco-design/web-react';

export const SkillInstanceList = () => {
  const { dataList, loadMore, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listSkillInstances({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    loadMore();
  }, []);

  if (dataList.length === 0) {
    return <Empty description="暂无技能实例" />;
  }
  return (
    <List
      className="skill-instance-list"
      grid={{
        sm: 42,
        md: 16,
        lg: 10,
        xl: 8,
      }}
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: SkillInstance, key) => (
        <List.Item
          key={key}
          style={{
            padding: '0',
            width: '100%',
          }}
          className="skill-instance-list__item"
          actionLayout="vertical"
          onClick={() => {}}
        >
          <SkillItem data={item} source="instance" isInstalled={true} showExecute={true} />
        </List.Item>
      )}
    />
  );
};
