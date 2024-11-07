import { useState } from 'react';
import { Modal, message } from 'antd';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useTranslation } from 'react-i18next';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components/search-select';
import { ProjectInfo } from '@refly-packages/ai-workspace-common/stores/chat';

interface CanvasMoveModalProps {
  canvasId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  handleMoveCallback?: () => void;
}
export const CanvasMoveModal = (props: CanvasMoveModalProps) => {
  const { t } = useTranslation();
  const { open, setOpen, canvasId, handleMoveCallback } = props;
  const [project, setProject] = useState<ProjectInfo | null>(null);

  const updateCanvasProject = async (project: ProjectInfo) => {
    const { data: canvas } = await getClient().getCanvasDetail({ query: { canvasId } });
    const { data } = await getClient().updateCanvas({
      body: { ...canvas.data, projectId: project.projectId },
    });

    console.log('updateCanvasProject', data);
    if (data?.success) {
      message.success(t('projectDetail.directory.projectSelector.success'));
      setOpen(false);
      handleMoveCallback && handleMoveCallback();
    }
  };
  return (
    <Modal
      title={t('projectDetail.directory.projectSelector.title')}
      open={open}
      centered
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      onOk={() => {
        setOpen(false);
        if (project) {
          updateCanvasProject(project);
        }
      }}
      onCancel={() => setOpen(false)}
    >
      <p className="text-sm text-gray-600 my-3">{t('projectDetail.directory.projectSelector.tip')}</p>
      <SearchSelect
        className="w-full mb-3"
        domain="project"
        allowCreateNewEntity
        onChange={(projectId, option) => {
          const opt = Array.isArray(option) ? option[0] : option;
          setProject({ projectId, title: String(opt?.label || '') });
        }}
      />
    </Modal>
  );
};
