import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-document';
import { IconCreateDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
// import { TemplatesGuide } from './templates-guide';

export const EmptyGuide = ({ canvasId }: { canvasId: string }) => {
  const { t } = useTranslation();
  const { createSingleDocumentInCanvas, isCreating: isCreatingDocument } = useCreateDocument();
  console.log(canvasId);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[70%]">
      <div className="flex items-center justify-center text-gray-500 text-center">
        <div className="text-[20px]">{t('canvas.emptyText')}</div>
        <Button
          loading={isCreatingDocument}
          icon={<IconCreateDocument className="-mr-1 flex items-center justify-center" />}
          type="text"
          className="ml-0.5 text-[20px] text-[#00968F] py-[4px] px-[8px]"
          onClick={() => createSingleDocumentInCanvas()}
          data-cy="canvas-create-document-button"
        >
          {t('canvas.toolbar.createDocument')}
        </Button>
      </div>

      {/* <TemplatesGuide canvasId={canvasId} /> */}
    </div>
  );
};
