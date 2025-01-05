import { useTranslation } from 'react-i18next';
import { Modal } from 'antd';
import { useCookie } from 'react-use';
import Cookies from 'js-cookie';
import { getCookieOrigin, getExtensionId } from '@refly/utils/url';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';

export const useLogout = () => {
  const { t } = useTranslation();
  const userStore = useUserStoreShallow((state) => ({
    resetState: state.resetState,
  }));
  const canvasStore = useCanvasStoreShallow((state) => ({
    clearState: state.clearState,
  }));
  const documentStore = useDocumentStoreShallow((state) => ({
    clearState: state.clearState,
  }));
  const chatStore = useChatStoreShallow((state) => ({
    resetState: state.resetState,
  }));
  const [modal, contextHolder] = Modal.useModal();
  const [_, __, deleteCookie] = useCookie('_refly_ai_sid');

  const handleLogout = () => {
    modal.confirm?.({
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      title: t('settings.account.logoutConfirmation.title'),
      content: t('settings.account.logoutConfirmation.message'),
      centered: true,
      async onOk() {
        // Clear IndexedDB
        const deleteIndexedDB = async () => {
          try {
            const databases = await window.indexedDB.databases?.();
            databases?.forEach((db) => {
              window.indexedDB.deleteDatabase(db.name ?? '');
            });
          } catch (error) {
            console.error('Failed to clear IndexedDB:', error);
          }
        };

        await deleteIndexedDB();

        // Clear all local storage
        try {
          localStorage.clear();
        } catch (error) {
          console.error('Failed to clear localStorage:', error);
        }

        // Clear cookies
        deleteCookie?.();
        Cookies?.remove?.('_refly_ai_sid', { domain: getCookieOrigin() });

        // Reset local state
        userStore.resetState();
        canvasStore.clearState();
        documentStore.clearState();
        chatStore.resetState();

        // Reload page
        window.location.reload();
      },
    });
  };

  return {
    handleLogout,
    contextHolder,
  };
};
