import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';
import { IconTemplate } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Modal, Input, Divider } from 'antd';
import { CanvasTemplateCategory } from '@refly/openapi-schema';

import { cn } from '@refly-packages/utils/cn';
import './index.scss';
import { TemplateList } from './template-list';
import { useListCanvasTemplateCategories } from '@refly-packages/ai-workspace-common/queries';
const TitleRender = () => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 pl-4 pr-10 py-4">
        <div className="flex items-center gap-2 text-lg font-medium">
          <IconTemplate /> {t('template.templateLibrary')}
        </div>
        <Input className="w-80" placeholder="Search" />
        <div>按语言筛选</div>
      </div>
      <Divider className="my-0" />
    </div>
  );
};

const TemplateCategoryList = ({
  categories,
  currentCategory,
  setCurrentCategory,
}: {
  categories: CanvasTemplateCategory[];
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
}) => {
  const { i18n } = useTranslation();
  const currentUiLocale = i18n.language as 'en' | 'zh-CN';
  return (
    <div className="h-full w-[40%] max-w-[200px] overflow-y-auto p-4 box-border flex-shrink-0 flex flex-col gap-2">
      {categories.map((category) => (
        <div key={category.categoryId}>
          <div
            className={cn(
              'cursor-pointer px-2 py-1 rounded-md hover:bg-gray-100 w-full truncate',
              currentCategory === category.categoryId && 'bg-gray-100',
            )}
            onClick={() => setCurrentCategory(category.categoryId)}
          >
            {category.labelDict[currentUiLocale]}
          </div>
          {category.categoryId === 'my-templates' && categories.length > 1 && (
            <Divider className="mt-2 mb-0" />
          )}
        </div>
      ))}
    </div>
  );
};

const myTemp: CanvasTemplateCategory = {
  categoryId: 'my-templates',
  labelDict: {
    'en-US': 'My Templates',
    'zh-CN': '我的模板',
  },
  name: 'My Templates',
  descriptionDict: {
    'en-US': 'My Templates',
    'zh-CN': '我的模板',
  },
};

export const CanvasTemplateModal = () => {
  const { visible, setVisible } = useCanvasTemplateModal((state) => ({
    visible: state.visible,
    setVisible: state.setVisible,
  }));
  const [currentCategory, setCurrentCategory] = useState('my-templates');

  const { data } = useListCanvasTemplateCategories();

  return (
    <Modal
      className="template-list"
      centered
      title={<TitleRender />}
      width="80%"
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
      focusTriggerAfterClose={false}
    >
      <div className="canvas-template-modal flex h-[80vh] overflow-hidden">
        <TemplateCategoryList
          categories={[myTemp, ...(data?.data ?? [])]}
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
        />
        <TemplateList language={'zh-CN'} categoryId={currentCategory} />
      </div>
    </Modal>
  );
};
