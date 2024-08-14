import { useState, useEffect } from 'react';

// components
import { useTranslation } from 'react-i18next';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

import './index.scss';
import { SkillJob } from '@refly/openapi-schema';

import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { List, Empty, Typography } from '@arco-design/web-react';
import { IconLeft, IconPlayArrow, IconDelete } from '@arco-design/web-react/icon';

export const SkillTriggers = () => {
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get('skillId') as string;

  const { dataList, loadMore, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listSkillTriggers({
        query: { ...queryPayload, skillId },
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    loadMore();
  }, []);

  if (dataList.length === 0) {
    return <Empty description="请先配置触发器" />;
  }
  return (
    <List
      className="skill-triggers"
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: SkillJob, key) => (
        <List.Item
          key={item?.jobId + key}
          style={{
            padding: '0',
            width: '100%',
          }}
          className="skill-jobs__list-item"
          actionLayout="vertical"
          onClick={() => {}}
        >
          {item.skillDisplayName}
        </List.Item>
      )}
    />
  );
};
