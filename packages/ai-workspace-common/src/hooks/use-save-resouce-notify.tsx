import { Message, Link } from '@arco-design/web-react';

import { delay } from '@refly/utils';
import { useTranslation } from 'react-i18next';

export const useSaveResourceNotify = () => {
  const { t } = useTranslation();
  const handleSaveResourceAndNotify = async (saveResource: () => Promise<{ success: boolean; url: string }>) => {
    const close = Message.loading({
      content: t('extension.floatingSphere.isSaving'),
      duration: 0,
      style: {
        borderRadius: 8,
        background: '#fcfcf9',
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
            {t('extension.floatingSphere.saveResourceSuccess.prefix')}{' '}
            <Link href={url} target="_blank" style={{ borderRadius: 4 }} hoverable>
              {t('extension.floatingSphere.saveResourceSuccess.link')}
            </Link>{' '}
            {t('extension.floatingSphere.saveResourceSuccess.suffix')}
          </span>
        ),
        duration: 5000,
        style: {
          borderRadius: 8,
          background: '#fcfcf9',
        },
        closable: true,
      });
    } else {
      Message.error({
        content: t('extension.floatingSphere.saveResourceFailed'),
        duration: 3000,
        style: {
          borderRadius: 8,
          background: '#fcfcf9',
        },
      });
    }
  };

  return {
    handleSaveResourceAndNotify,
  };
};
