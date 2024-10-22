import React, { useState } from 'react';
import classNames from 'classnames';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Tag, Popconfirm, Message } from '@arco-design/web-react';
import { HiOutlineFolder, HiFolderPlus } from 'react-icons/hi2';

import { Collection } from '@refly/openapi-schema';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { ResourceCollectionAssociativeModal } from '@refly-packages/ai-workspace-common/components/knowledge-base/resource-detail/resource-collection-associative-modal';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import './index.scss';

interface ResourceCollectionListProps {
  collections: Collection[];
  updateCallback?: (collectionId: string) => void;
}

const ResourceCollectionList = ({ collections = [], updateCallback }: ResourceCollectionListProps) => {
  const { t } = useTranslation();
  const { jumpToProject } = useKnowledgeBaseJumpNewPath();
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');
  const [visible, setVisible] = useState(false);

  const TagItem = (props: { coll: Collection }) => {
    const { coll } = props;
    const [popconfirmVisible, setPopconfirmVisible] = useState(false);

    const handleDeleteClick = async ({ collectionId, resourceId }) => {
      let resultError: unknown;
      try {
        const { error } = await getClient().removeResourceFromCollection({
          body: { collectionId, resourceIds: [resourceId] },
        });
        resultError = error;
      } catch (error) {
        resultError = error;
      }

      if (resultError) {
        Message.error({ content: t('common.putErr') });
      } else {
        Message.success({ content: t('common.putSuccess') });
        updateCallback && updateCallback(coll.collectionId);
      }
    };

    const handleTagClick = () => {
      if (coll.collectionId === kbId) {
        jumpToProject({ projectId: '' });
      } else {
        jumpToProject({ projectId: coll.collectionId });
      }
    };

    const handleCancel = (e) => {
      e.stopPropagation();
      setPopconfirmVisible(false);
    };

    return (
      <>
        <Popconfirm
          position="bottom"
          title={t('workspace.resourceCollectionList.removeConfirmText')}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          popupVisible={popconfirmVisible}
          onCancel={(e) => handleCancel(e)}
          onOk={() => handleDeleteClick({ collectionId: coll.collectionId, resourceId: resId })}
          triggerProps={{ onClickOutside: () => setPopconfirmVisible(false) }}
        >
          <Tag
            closable
            className={classNames('resource-collection-list-item', {
              active: coll.collectionId === kbId,
            })}
            visible={true}
            icon={<HiOutlineFolder />}
            onClick={handleTagClick}
            onClose={(e) => {
              e.stopPropagation();
              setPopconfirmVisible(true);
            }}
          >
            {coll.title}
          </Tag>
        </Popconfirm>
        <Divider type="vertical" />
      </>
    );
  };

  return (
    <div className="resource-collection-list">
      {collections.map((coll) => (
        <div className="tag-wrap" key={coll.collectionId}>
          <TagItem coll={coll} />
        </div>
      ))}

      <Button
        size="mini"
        className="bg-transparent"
        title={collections?.length > 0 ? t('workspace.resourceCollectionList.addToCollection') : ''}
        style={{ borderRadius: '999px' }}
        icon={<HiFolderPlus size={13} />}
        onClick={() => setVisible(true)}
      >
        {collections?.length === 0 && t('workspace.resourceCollectionList.addToCollection')}
      </Button>

      <ResourceCollectionAssociativeModal
        domain="collection"
        visible={visible}
        setVisible={setVisible}
        postConfirmCallback={(collectionId) => updateCallback(collectionId as string)}
      />
    </div>
  );
};

export default ResourceCollectionList;
