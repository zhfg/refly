import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Divider } from 'antd';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-document';
import { IconCreateDocument } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useListCanvasTemplates } from '@refly-packages/ai-workspace-common/queries';
import { TemplateCard } from '@refly-packages/ai-workspace-common/components/canvas-template/template-list';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';
import { VscNotebookTemplate } from 'react-icons/vsc';
import { useDebouncedCallback } from 'use-debounce';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

export const EmptyGuide = ({ canvasId }: { canvasId: string }) => {
  const { setVisible } = useCanvasTemplateModal((state) => ({
    setVisible: state.setVisible,
  }));
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { createSingleDocumentInCanvas, isCreating: isCreatingDocument } = useCreateDocument();

  const { showTemplates, setShowTemplates } = useCanvasStoreShallow((state) => ({
    showTemplates: state.showTemplates,
    setShowTemplates: state.setShowTemplates,
  }));
  const { data, refetch } = useListCanvasTemplates({
    // TODO: scope = private for testing
    // TODO: add search
    query: { scope: 'private', page: 1, pageSize: 3 },
  });

  const debouncedRefetch = useDebouncedCallback(() => refetch(), 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    debouncedRefetch();
  }, [search]);

  useEffect(() => {
    setSearch('');
  }, [canvasId]);

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

      {showTemplates && (
        <div className="mt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('template.searchPlaceholder')}
                value={search}
                onChange={handleSearchChange}
                className="w-80"
              />
              {data?.data?.length === 0 && (
                <div className="text-gray-500 text-[14px]">{t('template.noRelatedTemplates')}</div>
              )}
            </div>

            <Button type="text" onClick={() => setShowTemplates(false)}>
              隐藏
            </Button>
          </div>
          <Divider className="mt-4 mb-2" />

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {data?.data?.length > 0 &&
              data.data.map((template) => (
                <TemplateCard key={template.templateId} template={template} showUser={false} />
              ))}
            <div
              className={`text-center font-bold bg-white rounded-lg m-2 flex flex-col items-center justify-center cursor-pointer shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out text-gray-500 hover:text-green-600 ${
                data?.data?.length > 0 ? '' : 'h-[200px]'
              }`}
              onClick={() => setVisible(true)}
            >
              <VscNotebookTemplate className="mb-3" size={35} />
              {t('template.moreTemplates')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
