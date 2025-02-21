import { useTranslation } from 'react-i18next';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';
import { IconTemplate } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Modal } from 'antd';

import './index.scss';

export const CanvasTemplateModal = () => {
  const { visible, setVisible } = useCanvasTemplateModal((state) => ({
    visible: state.visible,
    setVisible: state.setVisible,
  }));
  const { t } = useTranslation();

  return (
    <Modal
      className="canvas-list"
      centered
      title={
        <span className="flex items-center gap-2 text-lg font-medium">
          <IconTemplate /> {t('common.canvas')}
        </span>
      }
      width={1000}
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
      focusTriggerAfterClose={false}
    >
      ddd
    </Modal>
  );
};
