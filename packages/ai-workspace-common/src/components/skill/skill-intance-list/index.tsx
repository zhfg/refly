import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// components
import { InstanceItem } from '@refly-packages/ai-workspace-common/components/skill/skill-intance-list/instance-item';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

import { SkillInstance } from '@refly/openapi-schema';

import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { List, Empty, Button, Input } from '@arco-design/web-react';
import { IconArrowRight, IconSearch } from '@arco-design/web-react/icon';
import { useSearchableList } from '@refly-packages/ai-workspace-common/components/use-searchable-list';
import { useNavigate } from 'react-router-dom';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
// styles
import './index.scss';

export type SkillInstanceListSource = 'instance' | 'template' | 'skill-management-modal';

interface SkillInstanceListProps {
  canGoDetail?: boolean;
  source?: SkillInstanceListSource;
  isTopSkill?: boolean;
  topSkillList?: SkillInstance[];
}

export const SkillInstanceList = (props: SkillInstanceListProps) => {
  const { isTopSkill, topSkillList } = props;
  const { t } = useTranslation();
  const setSkillManagerModalVisible = useSkillStore((state) => state.setSkillManagerModalVisible);
  const { dataList, loadMore, setDataList, hasMore, isRequesting, reload } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listSkillInstances({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
  });
  const navigate = useNavigate();

  // support search by displayName
  const [searchVal, setSearchVal] = useState('');
  const [skillList, setSkillList, filter] = useSearchableList<SkillInstance>('displayName' as keyof SkillInstance, {
    debounce: true,
    delay: 300,
  });

  const goSkillList = () => {
    setSkillManagerModalVisible(false);
    navigate('/skill?tab=template');
  };

  const handleChange = (val: string) => {
    filter(val);
    setSearchVal(val);
  };

  useEffect(() => {
    if (isTopSkill) {
      return;
    }
    loadMore();
  }, []);

  useEffect(() => {
    if (isTopSkill) {
      return;
    }
    setSkillList(dataList);
  }, [dataList]);

  if (dataList.length === 0 && !isRequesting && !isTopSkill) {
    return <Empty description={t('skill.skillDetail.emptyInstances')} />;
  }
  return (
    <div className="skill-instance-list">
      {!isTopSkill ? (
        <div className="skill-instance-list__top-container">
          <div className="skill-search-container">
            <Input
              placeholder={t('skill.skillManagement.searchPlaceholder') || ''}
              allowClear
              className="skill-instance-list__search"
              style={{ height: 32, borderRadius: '8px' }}
              value={searchVal}
              prefix={<IconSearch />}
              onChange={handleChange}
            />
          </div>
          <Button type="primary" style={{ borderRadius: 8, height: 32 }} onClick={goSkillList}>
            <IconArrowRight />
            {t('skill.tab.skillTemplate')}
          </Button>
        </div>
      ) : null}

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
        dataSource={isTopSkill ? topSkillList || [] : skillList}
        loading={isRequesting}
        scrollLoading={
          isTopSkill ? null : <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
        }
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
            <InstanceItem
              itemKey={key}
              data={item}
              source={props.source}
              canGoDetail={props.canGoDetail}
              isTopSkill={isTopSkill}
              refreshList={reload}
              postDeleteList={(item: SkillInstance) => setDataList(dataList.filter((n) => n.skillId !== item.skillId))}
            />
          </List.Item>
        )}
      />
    </div>
  );
};
