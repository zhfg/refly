import { useTranslation } from 'react-i18next';
import { Modal } from 'antd';
import { useCookie } from 'react-use';
import Cookies from 'js-cookie';
import { getCookieOrigin, getExtensionId } from '@refly/utils/url';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

export const useLogout = () => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const [modal, contextHolder] = Modal.useModal();
  const [_, __, deleteCookie] = useCookie('_refly_ai_sid');

  const handleLogout = () => {
    modal.confirm?.({
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      title: t('settings.account.logoutConfirmation.title'),
      content: t('settings.account.logoutConfirmation.message'),
      centered: true,
      onOk() {
        // Clear local storage
        localStorage.removeItem('refly-user-profile');
        localStorage.removeItem('refly-local-settings');

        // Notify extension
        // chrome.runtime?.sendMessage(getExtensionId(), {
        //   name: 'external-refly-logout-notify',
        // });

        // Clear cookies
        deleteCookie?.();
        Cookies?.remove?.('_refly_ai_sid', { domain: getCookieOrigin() });

        // Reset user store
        userStore.resetState();

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
