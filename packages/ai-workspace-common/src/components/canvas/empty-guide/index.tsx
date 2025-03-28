import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { IconTemplate } from '@refly-packages/ai-workspace-common/components/common/icon';
import { TemplatesGuide } from './templates-guide';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';

export const EmptyGuide = ({ canvasId }: { canvasId: string }) => {
  const { t } = useTranslation();
  const { setVisible } = useCanvasTemplateModal((state) => ({
    setVisible: state.setVisible,
  }));

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[70%]"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex items-center justify-center text-gray-500 text-center"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="text-[20px]">{t('canvas.emptyText')}</div>
        <Button
          icon={<IconTemplate className="-mr-1 flex items-center justify-center" />}
          type="text"
          className="ml-0.5 text-[20px] text-[#00968F] py-[4px] px-[8px]"
          onClick={() => setVisible(true)}
          data-cy="canvas-create-document-button"
        >
          {t('loggedHomePage.siderMenu.template')}
        </Button>
      </div>

      <TemplatesGuide canvasId={canvasId} />
    </div>
  );
};
