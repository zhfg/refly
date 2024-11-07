import React from 'react';
import { Layout } from 'antd';
import { SearchBox } from './components/search-box';
import { SearchProgress } from './components/search-progress';
import { SearchResults } from './components/search-results';
import { useMultilingualSearchStore } from './stores/multilingual-search';
import { Globe } from 'lucide-react';
import './index.scss';

const { Header, Content } = Layout;

function MultilingualSearch() {
  const { isSearching, results, resetSearch } = useMultilingualSearchStore();

  return (
    <div className="multilingual-search-container">
      <div className="multilingual-search-inner-container">
        <SearchBox />
        {isSearching || results?.length > 0 ? <SearchProgress /> : null}
        {!isSearching && results.length > 0 && <SearchResults />}
      </div>
    </div>
  );
}

export default MultilingualSearch;
