import React, { useMemo } from 'react';
import { Input, Select, Space, Divider } from 'antd';
import { Search } from 'lucide-react';
import { useMultilingualSearchStoreShallow } from '../stores/multilingual-search';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import { languageNameToLocale, localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';

import './search-box.scss';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

const { Search: AntSearch } = Input;

export const SearchBox: React.FC = () => {
  const { i18n, t } = useTranslation();
  const currentUiLocale = i18n.language as LOCALE;

  const multilingualSearchStore = useMultilingualSearchStoreShallow((state) => ({
    query: state.query,
    searchLocales: state.searchLocales,
    outputLocale: state.outputLocale,
    setQuery: state.setQuery,
    setSearchLocales: state.setSearchLocales,
    setOutputLocale: state.setOutputLocale,
    setProcessingStep: state.setProcessingStep,
    setIsSearching: state.setIsSearching,
    addSearchStep: state.addSearchStep,
    setResults: state.setResults,
  }));

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
    const autoOption = {
      label: currentUiLocale === LOCALE.EN ? 'Auto' : '自动',
      value: 'auto',
    };
    return [autoOption, ...languageOptions];
  }, [languageOptions, currentUiLocale]);

  // 获取当前语言的显示名称
  const getLocaleName = (locale: string) => {
    const names = currentUiLocale === LOCALE.EN ? localeToLanguageName.en : localeToLanguageName['zh-CN'];
    return names[locale] || locale;
  };

  const handleMultilingualSearch = async (userInput?: string) => {
    if (userInput?.trim()?.length === 0) return;

    multilingualSearchStore.setIsSearching(true);
    multilingualSearchStore.setProcessingStep();

    try {
      const { data } = await getClient().multiLingualWebSearch({
        body: {
          query: userInput,
          searchLocaleList: multilingualSearchStore.searchLocales.map((locale) => locale.code),
          // resultDisplayLocale: multilingualSearchStore.outputLocale.code,
          enableRerank: true,
        },
      });

      // Update search steps and results from response
      if (data?.data?.searchSteps) {
        data.data.searchSteps.forEach((step) => {
          if (step.step === 'finish') {
            multilingualSearchStore.addSearchStep(step);
          } else {
            multilingualSearchStore.addSearchStep(step);
            multilingualSearchStore.setProcessingStep();
          }
        });
      }

      if (data?.data?.sources) {
        multilingualSearchStore.setResults(data.data.sources);
      }
    } catch (error) {
      console.error('Multilingual search failed:', error);
      multilingualSearchStore.setIsSearching(false);
    }
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
    <div className="search-box">
      <div className="search-container">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <AntSearch
            size="large"
            placeholder={t('resource.multilingualSearch.placeholder')}
            value={multilingualSearchStore.query}
            className="search-input"
            onChange={(e) => multilingualSearchStore.setQuery(e.target.value)}
            onSearch={handleMultilingualSearch}
            enterButton={<Search />}
          />
          <Space className="search-options">
            <div className="select-group">
              <label className="select-label">{t('resource.multilingualSearch.searchLabel')}</label>
              <Select
                mode="multiple"
                showSearch
                size="small"
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
                showArrow
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </div>
            <div className="select-group">
              <label className="select-label">{t('resource.multilingualSearch.displayLabel')}</label>
              <Select
                showSearch
                size="small"
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
                showArrow
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </div>
          </Space>
        </Space>
      </div>
    </div>
  );
};
