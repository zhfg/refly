import { Message, Link } from '@arco-design/web-react';

import { delay } from '@refly/utils';

export const useSaveResourceNotify = () => {
  const handleSaveResourceAndNotify = async (saveResource: () => Promise<{ success: boolean; url: string }>) => {
    const close = Message.loading({
      content: '保存中...',
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
            保存成功，点击{' '}
            <Link href={url} target="_blank" style={{ borderRadius: 4 }} hoverable>
              链接
            </Link>{' '}
            查看
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
        content: '保存失败，请尝试重新保存',
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
