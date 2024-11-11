import React, { useMemo } from 'react';
import { Input, Select, Space, Divider } from 'antd';
import { Search } from 'lucide-react';
import { useMultilingualSearchStoreShallow } from '../stores/multilingual-search';
import { useTranslation } from 'react-i18next';

import { SearchOptions } from './search-options';

import './search-box.scss';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { IconSearch } from '@arco-design/web-react/icon';

const { Search: AntSearch } = Input;

export const SearchBox: React.FC = () => {
  const { t } = useTranslation();

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
    setPageState: state.setPageState,
  }));

  const handleMultilingualSearch = async (userInput?: string) => {
    if (userInput?.trim()?.length === 0) return;

    multilingualSearchStore.setIsSearching(true);
    multilingualSearchStore.setProcessingStep();
    multilingualSearchStore.setPageState('results');

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
            enterButton={<IconSearch />}
          />
          <SearchOptions />
        </Space>
      </div>
    </div>
  );
};
