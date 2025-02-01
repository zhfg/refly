import { Message, Link } from '@arco-design/web-react';

import { delay } from '@refly/utils';
import { useTranslation } from 'react-i18next';

export const useSaveResourceNotify = () => {
  const { t } = useTranslation();
  const handleSaveResourceAndNotify = async (
    saveResource: () => Promise<{ success: boolean; url: string }>,
  ) => {
    const close = Message.loading({
      content: t('resource.import.isSaving'),
      duration: 0,
      style: {
        borderRadius: 8,
        background: '#FFFFFF',
      },
    });
    const { success, url } = await saveResource();

    await delay(2000);
    close();
    await delay(200);

    if (success) {
      Message.success({
        content: (
          <span>
            {t('resource.import.saveResourceSuccess.prefix')}{' '}
            <Link
              href={`${url}?openLibrary=true`}
              target="_blank"
              style={{ borderRadius: 4 }}
              hoverable
            >
              {t('resource.import.saveResourceSuccess.link')}
            </Link>{' '}
            {t('resource.import.saveResourceSuccess.suffix')}
          </span>
        ),
        duration: 5000,
        style: {
          borderRadius: 8,
          background: '#fff',
        },
        closable: true,
      });
    }
  };

  return {
    handleSaveResourceAndNotify,
  };
};
