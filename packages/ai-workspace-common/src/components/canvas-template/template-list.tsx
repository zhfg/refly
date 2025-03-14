import { useEffect } from 'react';
import { Empty, Avatar, Button, Typography } from 'antd';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { useTranslation } from 'react-i18next';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { CanvasTemplate } from '@refly/openapi-schema';
import { IoPersonOutline } from 'react-icons/io5';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';
import { useDebouncedCallback } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { useDuplicateCanvas } from '@refly-packages/ai-workspace-common/hooks/use-duplicate-canvas';
import { staticPublicEndpoint } from '@refly-packages/ai-workspace-common/utils/env';

export const TemplateCard = ({
  template,
  className,
  showUser = true,
}: { template: CanvasTemplate; className?: string; showUser?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setVisible: setModalVisible } = useCanvasTemplateModal((state) => ({
    setVisible: state.setVisible,
  }));
  const { duplicateCanvas, loading: duplicating } = useDuplicateCanvas();

  const handlePreview = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (template.shareId) {
      setModalVisible(false);
      navigate(`/preview/canvas/${template.shareId}`);
    }
  };

  const handleUse = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (template.shareId) {
      duplicateCanvas(template.shareId);
    }
  };

  return (
    <div
      className={`${className} m-2 group relative p-2 bg-white rounded-lg overflow-hidden cursor-pointer shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out`}
    >
      <div className="p-2 flex justify-between items-center gap-2">
        <div className="text-sm font-medium truncate">{template.title || 'common.untitled'}</div>
      </div>
      <div className="mx-2 h-36 rounded-md bg-gray-100 flex items-center justify-center">
        <img
          src={`${staticPublicEndpoint}/share-cover/${template.shareId}.png`}
          alt={`${template.title} cover`}
          className="w-full h-full object-cover"
        />
      </div>

      {showUser && (
        <>
          <div className="mx-2 mt-2 text-sm text-gray-500">
            <Typography.Paragraph ellipsis={{ tooltip: true, rows: 2 }}>
              {template.description}
            </Typography.Paragraph>
          </div>

          <div className="p-2 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar
                src={template.shareUser?.avatar}
                icon={!template.shareUser?.avatar && <IoPersonOutline />}
              />
              <div className="truncate">{template.shareUser?.name}</div>
            </div>
          </div>
        </>
      )}

      <div className="absolute left-0 bottom-0 w-full h-20 py-2 px-4 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between gap-3">
        <Button
          size="large"
          type="default"
          className="flex-1 p-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-white hover:bg-gray-100"
          onClick={handlePreview}
        >
          {t('template.preview')}
        </Button>
        <Button
          loading={duplicating}
          size="large"
          type="primary"
          className="flex-1 p-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100"
          onClick={handleUse}
        >
          {t('template.use')}
        </Button>
      </div>
    </div>
  );
};

interface TemplateListProps {
  language: string;
  categoryId: string;
  searchQuery?: string;
}

export const TemplateList = ({ language, categoryId, searchQuery }: TemplateListProps) => {
  const { t } = useTranslation();
  const { visible } = useCanvasTemplateModal((state) => ({
    visible: state.visible,
  }));
  const { dataList, loadMore, reload, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listCanvasTemplates({
        query: {
          language,
          categoryId: categoryId === 'my-templates' ? null : categoryId,
          scope: categoryId === 'my-templates' ? 'private' : 'public',
          ...queryPayload,
        },
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    if (!visible) return;
    reload();
  }, [language, categoryId, visible]);

  const debounced = useDebouncedCallback(() => {
    reload();
  }, 300);

  useEffect(() => {
    debounced();
  }, [searchQuery]);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8F9FA] p-4">
      <Spin className="spin" spinning={isRequesting}>
        {isRequesting || dataList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2">
              {dataList.map((item) => (
                <TemplateCard key={item.templateId} template={item} />
              ))}
            </div>
            <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Empty description={t('common.empty')} />
          </div>
        )}
      </Spin>
    </div>
  );
};
