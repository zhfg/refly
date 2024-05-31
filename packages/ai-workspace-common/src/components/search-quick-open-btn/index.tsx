import { useQuickSearchStateStore } from '@refly-packages/ai-workspace-common/stores/quick-search-state';
import { reflyEnv } from '@refly-packages/ai-workspace-common/utils/env';

import './index.scss';
import { useTranslation } from 'react-i18next';

export const SearchQuickOpenBtn = () => {
  // stores
  const quickSearchStateStore = useQuickSearchStateStore();

  const { t } = useTranslation();

  return (
    <div className="search-quick-open-container">
      <div
        className="search-quick-open-input"
        onClick={() => {
          quickSearchStateStore.setVisible(true);
        }}
      >
        <div className="search-quick-open-text">{t('loggedHomePage.newThreadText')}</div>
        <div className="search-quick-open-shortcuts">
          <div className="search-quick-open-shortcut-key">{reflyEnv.getOsType() === 'OSX' ? '⌘' : 'ctrl'}</div>
          <div className="search-quick-open-shortcut-key search-quick-open-shortcut-key__right">K</div>
        </div>
      </div>
    </div>
  );
};
