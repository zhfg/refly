import { useTranslation } from 'react-i18next';

import { DocumentList } from '../document-list';
import { ResourceList } from '../resource-list';
import { ProjectList } from '../project-list';

import { Modal, Tabs, Button, Tooltip } from 'antd';
import './index.scss';
import {
  IconDocument,
  IconLibrary,
  IconProject,
  IconResource,
  IconPlus,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { CreateProjectModal } from '@refly-packages/ai-workspace-common/components/project/project-create';
import { useState, useMemo } from 'react';
import { useGetProjectCanvasId } from '@refly-packages/ai-workspace-common/hooks/use-get-project-canvasId';

interface LibraryModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const LibraryModal = (props: LibraryModalProps) => {
  const { visible, setVisible } = props;
  const { t } = useTranslation();
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);
  const { projectId } = useGetProjectCanvasId();

  const activeKey = useKnowledgeBaseStoreShallow((state) => state.libraryModalActiveKey);
  const updateLibraryModalActiveKey = useKnowledgeBaseStoreShallow(
    (state) => state.updateLibraryModalActiveKey,
  );

  const [refreshProjectList, setRefreshProjectList] = useState(false);

  const tabs = useMemo(
    () => [
      {
        key: 'project',
        label: (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center">
              <IconProject />
              <span className="ml-1">{t('common.project')}</span>
            </span>
            <Tooltip title={t('project.create')}>
              <Button
                type="text"
                icon={<IconPlus size={16} className="text-gray-600" />}
                size="small"
                className="ml-1 rounded-full"
                onClick={() => {
                  setCreateProjectModalVisible(true);
                }}
              />
            </Tooltip>
          </div>
        ),
        children: <ProjectList refresh={refreshProjectList} setRefresh={setRefreshProjectList} />,
      },
      !projectId && {
        key: 'document',
        label: (
          <span className="flex items-center">
            <IconDocument />
            <span className="ml-1">{t('common.document')}</span>
          </span>
        ),
        children: <DocumentList />,
      },
      !projectId && {
        key: 'resource',
        label: (
          <span className="flex items-center">
            <IconResource />
            <span className="ml-1">{t('common.resource')}</span>
          </span>
        ),
        children: <ResourceList />,
      },
    ],
    [activeKey, t, refreshProjectList],
  );

  return (
    <>
      <Modal
        className="library-modal"
        centered
        title={
          <span className="flex items-center gap-2 text-lg font-medium">
            <IconLibrary /> {t('common.library')}
          </span>
        }
        width={1200}
        footer={null}
        open={visible}
        onCancel={() => setVisible(false)}
        focusTriggerAfterClose={false}
      >
        <Tabs
          defaultActiveKey={activeKey}
          items={tabs}
          onChange={(key) => updateLibraryModalActiveKey(key)}
        />
      </Modal>

      <CreateProjectModal
        mode="create"
        visible={createProjectModalVisible}
        setVisible={setCreateProjectModalVisible}
        onSuccess={() => {
          setRefreshProjectList(true);
        }}
      />
    </>
  );
};
