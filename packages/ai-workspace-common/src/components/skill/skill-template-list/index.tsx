import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// components
import { TemplateItem } from '@refly-packages/ai-workspace-common/components/skill/skill-template-list/template-item';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

import { SkillTemplate } from '@refly/openapi-schema';

import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { List, Empty, Button, Input } from '@arco-design/web-react';
import { HiMiniArrowUturnRight } from 'react-icons/hi2';
import { HiSearch } from 'react-icons/hi';
import { useSearchableList } from '@refly-packages/ai-workspace-common/components/use-searchable-list';
import { useNavigate } from 'react-router-dom';

export const SkillTemplateList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dataList, loadMore, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listSkillTemplates({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
  });
  // support search by displayName
  const [searchVal, setSearchVal] = useState('');
  const [skillList, setSkillList, filter] = useSearchableList<SkillTemplate>(
    'displayName' as keyof SkillTemplate,
    {
      debounce: true,
      delay: 300,
    },
  );

  const handleChange = (val: string) => {
    filter(val);
    setSearchVal(val);
  };

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    setSkillList(dataList);
  }, [dataList?.length]);

  return (
    <div className="skill-instance-list">
      <div className="skill-instance-list__top-container">
        <div className="skill-search-container">
          <Input
            placeholder={t('skill.skillManagement.searchPlaceholder') || ''}
            allowClear
            className="skill-instance-list__search"
            style={{ height: 32, borderRadius: '8px' }}
            value={searchVal}
            prefix={<HiSearch />}
            onChange={handleChange}
          />
        </div>
        <Button
          type="primary"
          style={{ borderRadius: 8, height: 32 }}
          onClick={() => {
            navigate('/skill?tab=instance');
          }}
        >
          <HiMiniArrowUturnRight />
          {t('skill.tab.skillInstances')}
        </Button>
      </div>
      {skillList.length === 0 && !isRequesting ? (
        <Empty description={t('skill.skillDetail.emptyTemplates')} />
      ) : (
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
          dataSource={skillList}
          scrollLoading={
            <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
          }
          render={(item: SkillTemplate, key) => (
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
              <TemplateItem itemKey={key} data={item} source="template" />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};
