import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-document';
import { IconCreateDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useListCanvasTemplates } from '@refly-packages/ai-workspace-common/queries';
import { TemplateCard } from '@refly-packages/ai-workspace-common/components/canvas-template/template-list';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';

export const EmptyGuide = () => {
  const { setVisible } = useCanvasTemplateModal((state) => ({
    setVisible: state.setVisible,
  }));
  const { t } = useTranslation();
  const { createSingleDocumentInCanvas, isCreating: isCreatingDocument } = useCreateDocument();
  const { data } = useListCanvasTemplates({
    // TODO: scope = private for testing
    query: { scope: 'private', page: 1, pageSize: 10 },
  });
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[80%]">
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

      {data?.data.length > 0 && (
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {data?.data?.slice(0, 3).map((template) => (
            <TemplateCard key={template.templateId} template={template} showUser={false} />
          ))}
          <div
            className="text-center font-bold bg-white rounded-lg m-2 flex items-center justify-center cursor-pointer shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out text-gray-500 hover:text-gray-700"
            onClick={() => setVisible(true)}
          >
            {t('template.moreTemplates')}
          </div>
        </div>
      )}
    </div>
  );
};
