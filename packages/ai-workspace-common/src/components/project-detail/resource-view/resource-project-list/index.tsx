import React, { useState } from 'react';
import classNames from 'classnames';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Tag, Popconfirm, Message } from '@arco-design/web-react';
import { HiOutlineFolder, HiFolderPlus } from 'react-icons/hi2';

import { Project } from '@refly/openapi-schema';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { BindResourceModal } from '@refly-packages/ai-workspace-common/components/project-detail/resource-view/resource-collection-associative-modal';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import './index.scss';

interface ResourceProjectListProps {
  projects: Project[];
  updateCallback?: (collectionId: string) => void;
}

const ResourceProjectList = ({ projects = [], updateCallback }: ResourceProjectListProps) => {
  const { t } = useTranslation();
  const { jumpToProject } = useJumpNewPath();
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const resId = searchParams.get('resId');
  const [visible, setVisible] = useState(false);

  const TagItem = (props: { coll: Project }) => {
    const { coll } = props;
    const [popconfirmVisible, setPopconfirmVisible] = useState(false);

    const handleDeleteClick = async ({ collectionId, resourceId }) => {
      let resultError: unknown;
      try {
        const { error } = await getClient().bindProjectResources({
          body: { projectId: collectionId, resourceIds: [resourceId], operation: 'unbind' },
        });
        resultError = error;
      } catch (error) {
        resultError = error;
      }

      if (resultError) {
        Message.error({ content: t('common.putErr') });
      } else {
        Message.success({ content: t('common.putSuccess') });
        updateCallback && updateCallback(coll.projectId);
      }
    };

    const handleTagClick = () => {
      if (coll.projectId === kbId) {
        jumpToProject({ projectId: '' });
      } else {
        jumpToProject({ projectId: coll.projectId });
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
          title={t('workspace.resourceProjectList.removeConfirmText')}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          popupVisible={popconfirmVisible}
          onCancel={(e) => handleCancel(e)}
          onOk={() => handleDeleteClick({ collectionId: coll.projectId, resourceId: resId })}
          triggerProps={{ onClickOutside: () => setPopconfirmVisible(false) }}
        >
          <Tag
            closable
            className={classNames('resource-collection-list-item', {
              active: coll.projectId === kbId,
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
      {projects.map((coll) => (
        <div className="tag-wrap" key={coll.projectId}>
          <TagItem coll={coll} />
        </div>
      ))}

      <Button
        size="mini"
        className="bg-transparent"
        title={projects?.length > 0 ? t('workspace.resourceProjectList.addToCollection') : ''}
        style={{ borderRadius: '999px' }}
        icon={<HiFolderPlus size={13} />}
        onClick={() => setVisible(true)}
      >
        {projects?.length === 0 && t('workspace.resourceProjectList.addToCollection')}
      </Button>

      <BindResourceModal
        domain="project"
        visible={visible}
        setVisible={setVisible}
        postConfirmCallback={(collectionId) => updateCallback(collectionId as string)}
      />
    </div>
  );
};

export default ResourceProjectList;
