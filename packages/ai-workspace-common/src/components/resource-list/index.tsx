// styles
import './index.scss';
import { IconSearch, IconPlus } from '@arco-design/web-react/icon';
import { Divider, Input, Skeleton } from '@arco-design/web-react';
import { useSearchableList } from '@refly-packages/ai-workspace-common/components/use-searchable-list';
import { useEffect, useState } from 'react';
import { Resource, RemoveResourceFromCollectionRequest } from '@refly/openapi-schema';
import { useSearchParams } from 'react-router-dom';

// 组件
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';
import { ResourceCollectionAssociativeModal } from '@refly-packages/ai-workspace-common/components/knowledge-base/resource-detail/resource-collection-associative-modal';
import { ResourceItem } from './resource-item';
import classNames from 'classnames';

interface ResourceListProps {
  resources: Partial<Resource>[];
  collectionId?: string;
  isFetching?: boolean;
  classNames?: string;
  placeholder: string;
  searchKey?: string;
  btnProps?: { defaultActiveKeys: string[] };
  showUtil?: boolean;
  showDesc?: boolean;
  showBtn?: { summary: boolean; markdown: boolean; externalOrigin: boolean };
  canDelete?: boolean;
  showAdd?: boolean;
  handleItemClick: (payload: { collectionId: string; resourceId: string }) => void;
  handleItemDelete?: (resource: RemoveResourceFromCollectionRequest) => void;
}

export const ResourceList = (props: ResourceListProps) => {
  const { searchKey = 'title', showAdd } = props;
  const [searchVal, setSearchVal] = useState('');
  const [visible, setVisible] = useState(false);
  const reloadKnowledgeBaseState = useReloadListState();
  const [searchParams] = useSearchParams();
  const resId = searchParams.get('resId');
  const [resourceList, setResourceList, filter] = useSearchableList<Resource>(searchKey as keyof Resource, {
    debounce: true,
    delay: 300,
  });

  const handleChange = (val: string) => {
    filter(val);
    setSearchVal(val);
  };

  const AddResourceBtn = () => {
    return (
      <div className="add-resource-btn" onClick={() => setVisible(true)}>
        <IconPlus />
      </div>
    );
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
        <div className="knowledge-base-directory-search-container-inner">
          <Input
            placeholder={props?.placeholder || ''}
            allowClear
            className="knowledge-base-directory-search"
            style={{ height: 32, borderRadius: '8px' }}
            value={searchVal}
            prefix={<IconSearch />}
            onChange={handleChange}
          />
          {showAdd && <AddResourceBtn />}
        </div>

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
              collectionId={props.collectionId}
              item={item}
              btnProps={props.btnProps}
              showUtil={props.showUtil}
              showDesc={props.showDesc}
              showBtn={props.showBtn}
              canDelete={props.canDelete}
              handleItemClick={props.handleItemClick}
              handleItemDelete={(item) => props.handleItemDelete(item)}
            />
          ))
        )}
      </div>
      <ResourceCollectionAssociativeModal
        domain="resource"
        mode="multiple"
        visible={visible}
        setVisible={setVisible}
        postConfirmCallback={(value: string[]) => {
          if (value.length > 0 && value.includes(resId)) {
            reloadKnowledgeBaseState.setReloadResourceDetail(true);
          }
          reloadKnowledgeBaseState.setReloadKnowledgeBaseList(true);
        }}
      />
    </div>
  );
};
