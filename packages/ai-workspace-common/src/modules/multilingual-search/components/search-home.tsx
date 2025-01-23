import { useTranslation } from 'react-i18next';
import { SearchBox } from './search-box';

// styles
import './search-home.scss';
import { useMultilingualSearchStoreShallow } from '../stores/multilingual-search';

const quickStartList = [
  {
    title: 'investment',
    emoji: '🗓️',
  },
  {
    title: 'productSearch',
    emoji: '🗓️',
  },
  {
    title: 'academicArticle',
    emoji: '📋',
  },
  {
    title: 'socialTweet',
    emoji: '📋',
  },
];

export const SearchHome = () => {
  const { t } = useTranslation();

  const { setPageState, setQuery } = useMultilingualSearchStoreShallow((state) => ({
    setPageState: state.setPageState,
    setQuery: state.setQuery,
  }));

  return (
    <div className="search-home-container">
      <div className="search-home-inner">
        <div className="search-home-header flex justify-between items-center">
          <div className="guide-text">{t('resource.multilingualSearch.title')}</div>
        </div>

        <div className="ai-copilot">
          <SearchBox />
          {/* <List
            grid={{
              sm: 48,
              md: 24,
              lg: 16,
              xl: 12,
            }}
            className="quick-start"
            wrapperStyle={{ width: '100%' }}
            bordered={false}
            pagination={false}
            dataSource={quickStartList}
            render={(item, key) => (
              <List.Item key={key} className="quick-start-item-container" actionLayout="vertical">
                <div
                  className="quick-start-item"
                  onClick={() => {
                    const suggestion = t(`homePage.suggestion.${item.title}`);
                    setQuery(suggestion);
                    setPageState('results');
                  }}
                >
                  <div className="quick-start-item-emoji">{item.emoji}</div>
                  <div className="quick-start-item-title">{t(`homePage.suggestion.${item.title}`)}</div>
                </div>
              </List.Item>
            )}
          /> */}
        </div>
      </div>
    </div>
  );
};
