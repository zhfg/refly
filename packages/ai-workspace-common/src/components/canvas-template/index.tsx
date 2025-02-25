import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvasTemplateModal } from '@refly-packages/ai-workspace-common/stores/canvas-template-modal';
import { IconTemplate } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Modal, Input, Divider, Select } from 'antd';
import { CanvasTemplateCategory } from '@refly/openapi-schema';

import { cn } from '@refly-packages/utils/cn';
import './index.scss';
import { TemplateList } from './template-list';
import { useListCanvasTemplateCategories } from '@refly-packages/ai-workspace-common/queries';
import { LuFilter } from 'react-icons/lu';

type Language = 'en' | 'zh-CN';

const dict = {
  en: { en: 'English', 'zh-CN': '英文' },
  'zh-CN': { en: 'Chinese', 'zh-CN': '中文' },
};

const TitleRender = ({
  searchQuery,
  uiLocale,
  language,
  setLanguage,
  setSearchQuery,
}: {
  uiLocale: Language;
  language: Language;
  searchQuery: string;
  setLanguage: (language: Language) => void;
  setSearchQuery: (searchQuery: string) => void;
}) => {
  const { t } = useTranslation();

  const languageOptions = [
    { label: '中文', value: 'zh-CN' },
    { label: '英文', value: 'en' },
  ];

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 pl-4 pr-16 py-4">
        <div className="flex items-center gap-2 text-lg font-medium">
          <IconTemplate /> {t('template.templateLibrary')}
        </div>
        <Input
          className="w-80"
          placeholder={t('template.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center">
          <LuFilter className="text-lg flex items-center -mr-2" />
          <Select
            className="flex-1"
            variant="borderless"
            options={languageOptions}
            value={language}
            onChange={handleLanguageChange}
            optionRender={(props) => {
              const { value } = props;
              return <div>{dict[value][uiLocale]}</div>;
            }}
            labelRender={(props) => {
              const { value } = props;
              return <div>{dict[value][uiLocale]}</div>;
            }}
          />
        </div>
      </div>
      <Divider className="my-0" />
    </div>
  );
};

const TemplateCategoryList = ({
  categories,
  currentCategory,
  setCurrentCategory,
  uiLocale,
}: {
  categories: CanvasTemplateCategory[];
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
  uiLocale: Language;
}) => {
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
            {category.labelDict[uiLocale]}
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
    en: 'My Templates',
    'zh-CN': '我的模板',
  },
  name: 'My Templates',
  descriptionDict: {
    en: 'My Templates',
    'zh-CN': '我的模板',
  },
};

export const CanvasTemplateModal = () => {
  const { visible, setVisible } = useCanvasTemplateModal((state) => ({
    visible: state.visible,
    setVisible: state.setVisible,
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('my-templates');
  const { i18n } = useTranslation();
  const currentUiLocale = i18n.language as Language;
  const [language, setLanguage] = useState(currentUiLocale);

  const { data } = useListCanvasTemplateCategories();

  return (
    <Modal
      className="template-list"
      centered
      title={
        <TitleRender
          uiLocale={currentUiLocale}
          language={language}
          setLanguage={setLanguage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      }
      width="80%"
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
      focusTriggerAfterClose={false}
    >
      <div className="canvas-template-modal flex h-[80vh] overflow-hidden">
        <TemplateCategoryList
          uiLocale={currentUiLocale}
          categories={[myTemp, ...(data?.data ?? [])]}
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
        />
        <TemplateList language={language} categoryId={currentCategory} searchQuery={searchQuery} />
      </div>
    </Modal>
  );
};
