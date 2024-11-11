import React from 'react';
import { Layout } from 'antd';
import { SearchBox } from './components/search-box';
import { SearchProgress } from './components/search-progress';
import { SearchResults } from './components/search-results';
import { ActionMenu } from './components/action-menu';
import { useMultilingualSearchStore, useMultilingualSearchStoreShallow } from './stores/multilingual-search';
import './index.scss';

const { Header, Content } = Layout;

function MultilingualSearch() {
  const { isSearching, results, outputLocale } = useMultilingualSearchStoreShallow((state) => ({
    isSearching: state.isSearching,
    results: state.results,
    outputLocale: state.outputLocale,
  }));

  return (
    <div className="multilingual-search-container">
      <div className="multilingual-search-inner-container">
        <SearchBox />
        {isSearching || results?.length > 0 ? <SearchProgress /> : null}
        {!isSearching && results.length > 0 && (
          <>
            <h3>Search Results ({results.length} sources)</h3>
            <SearchResults outputLocale={outputLocale} />
          </>
        )}
      </div>
      {!isSearching && results.length > 0 && (
        <div className="multilingual-search-action-menu-container">
          <ActionMenu />
        </div>
      )}
    </div>
  );
}

export default MultilingualSearch;
