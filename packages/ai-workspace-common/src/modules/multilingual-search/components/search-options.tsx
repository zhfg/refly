import React, { useMemo, useEffect } from 'react';
import { Input, Select, Space, Divider } from 'antd';
import { Search } from 'lucide-react';
import { useMultilingualSearchStoreShallow } from '../stores/multilingual-search';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import { languageNameToLocale, localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';

import './search-options.scss';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';

export const SearchOptions = () => {
  const { i18n, t } = useTranslation();
  const currentUiLocale = i18n.language as LOCALE;

  console.log('currentUiLocale', currentUiLocale);

  const multilingualSearchStore = useMultilingualSearchStoreShallow((state) => ({
    searchLocales: state.searchLocales,
    outputLocale: state.outputLocale,
    setSearchLocales: state.setSearchLocales,
    setOutputLocale: state.setOutputLocale,
  }));

  useEffect(() => {
    if (!multilingualSearchStore.outputLocale.code) {
      multilingualSearchStore.setOutputLocale({
        code: currentUiLocale,
        name: getLocaleName(currentUiLocale),
      });
    }
  }, [currentUiLocale]);

  // 构建语言选项
  const languageOptions = useMemo(() => {
    const languageMap = currentUiLocale === LOCALE.EN ? languageNameToLocale.en : languageNameToLocale['zh-CN'];

    return Object.entries(languageMap).map(([label, code]) => ({
      label,
      value: code,
    }));
  }, [currentUiLocale]);

  // 构建输出语言选项，增加 Auto 选项
  const outputLanguageOptions = useMemo(() => {
    return [...languageOptions];
  }, [languageOptions, currentUiLocale]);

  // 获取当前语言的显示名称
  const getLocaleName = (locale: string) => {
    const names = currentUiLocale === LOCALE.EN ? localeToLanguageName.en : localeToLanguageName['zh-CN'];
    return names[locale] || locale;
  };

  const handleSearchLocalesChange = (values: string[]) => {
    if (values.length > 3) {
      // Remove the oldest selected language and add the new one
      values = [...values.slice(-3)];
    }

    const newLocales = values.map((code) => ({
      code,
      name: getLocaleName(code),
    }));
    multilingualSearchStore.setSearchLocales(newLocales);
  };

  return (
    <Space className="search-options">
      <div className="select-group">
        <label className="select-label">{t('resource.multilingualSearch.searchLabel')}</label>
        <Select
          mode="multiple"
          showSearch
          variant="filled"
          style={{ minWidth: 300 }}
          maxTagCount="responsive"
          placeholder={t('resource.multilingualSearch.selectSearchLanguages')}
          value={multilingualSearchStore.searchLocales.map((l) => l.code)}
          onChange={handleSearchLocalesChange}
          options={languageOptions}
          maxTagTextLength={10}
          maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
          popupClassName="search-language-dropdown"
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </div>
      <div className="select-group">
        <label className="select-label">{t('resource.multilingualSearch.displayLabel')}</label>
        <Select
          showSearch
          variant="filled"
          style={{ minWidth: 200 }}
          placeholder={t('resource.multilingualSearch.selectDisplayLanguage')}
          value={multilingualSearchStore.outputLocale.code}
          onChange={(value) => {
            multilingualSearchStore.setOutputLocale({
              code: value,
              name: value === 'auto' ? (currentUiLocale === LOCALE.EN ? 'Auto' : '自动') : getLocaleName(value),
            });
          }}
          options={outputLanguageOptions}
          popupClassName="display-language-dropdown"
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </div>
    </Space>
  );
};
