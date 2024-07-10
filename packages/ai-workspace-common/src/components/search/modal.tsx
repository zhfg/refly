import { Modal } from '@arco-design/web-react';
import { Search } from './index';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { useEffect } from 'react';
import { bigSearchQuickOpenEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/big-search-quick-open';

export const BigSearchModal = () => {
  const searchStore = useSearchStore();
  const loading = true;
  console.log('searchStore.isSearchOpen', searchStore.isSearchOpen);

  useEffect(() => {
    bigSearchQuickOpenEmitter.on('openSearch', () => {
      searchStore.setIsSearchOpen(true);
    });

    bigSearchQuickOpenEmitter.on('closeSearch', () => {
      searchStore.setIsSearchOpen(false);
    });
  }, []);

  return (
    <Modal
      visible={searchStore.isSearchOpen}
      onCancel={() => searchStore.setIsSearchOpen(false)}
      maskStyle={{ background: 'transparent' }}
      footer={null}
      closeIcon={null}
      style={{ background: 'transparent', top: -100 }}
    >
      <Search />
    </Modal>
  );
};
