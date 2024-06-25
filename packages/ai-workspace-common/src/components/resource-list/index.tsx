// styles
import './index.scss';
import { IconSearch } from '@arco-design/web-react/icon';
import { Divider, Input, Skeleton } from '@arco-design/web-react';
import { useSearchableList } from '@refly-packages/ai-workspace-common/components/use-searchable-list';
import { useEffect, useState } from 'react';
import { Resource } from '@refly/openapi-schema';
// 组件
import { ResourceItem } from './resource-item';
import classNames from 'classnames';

interface ResourceListProps {
  resources: Partial<Resource>[];
  isFetching?: boolean;
  classNames?: string;
  placeholder: string;
  searchKey?: string;
  btnProps?: { defaultActiveKeys: string[] };
  showUtil?: boolean;
  showDesc?: boolean;
  showBtn?: { summary: boolean; markdown: boolean; externalOrigin: boolean };
  handleItemClick: (payload: { collectionId: string; resourceId: string }) => void;
}

export const ResourceList = (props: ResourceListProps) => {
  const { searchKey = 'title' } = props;
  const [searchVal, setSearchVal] = useState('');
  const [resourceList, setResourceList, filter] = useSearchableList<Resource>(searchKey as keyof Resource, {
    debounce: true,
    delay: 300,
  });

  const handleChange = (val: string) => {
    filter(val);
    setSearchVal(val);
  };

  useEffect(() => {
    const mappedDirectoryList = (props?.resources || []).map((item) => ({
      ...item,
      title: item?.data?.title || '',
    }));
    setResourceList(mappedDirectoryList as Resource[]);
  }, [props?.resources?.length]);

  return (
    <div className={classNames('knowledge-base-resource-list-container', props.classNames)}>
      <div className="knowledge-base-directory-search-container">
        <Input
          placeholder={props?.placeholder || ''}
          allowClear
          className="knowledge-base-directory-search"
          style={{ height: 32, borderRadius: '8px' }}
          value={searchVal}
          prefix={<IconSearch />}
          onChange={handleChange}
        />
        <Divider />
      </div>
      <div className="knowledge-base-directory-list">
        {props?.isFetching ? (
          <div style={{ margin: '8px auto' }}>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          </div>
        ) : (
          (resourceList || []).map((item, index) => (
            <ResourceItem
              key={index}
              index={index}
              item={item}
              btnProps={props.btnProps}
              showUtil={props.showUtil}
              showDesc={props.showDesc}
              showBtn={props.showBtn}
              handleItemClick={props.handleItemClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
