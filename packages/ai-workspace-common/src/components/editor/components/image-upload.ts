import { createImageUpload } from '@refly-packages/ai-workspace-common/components/editor/core/plugins';
import { getServerOrigin } from '@refly-packages/utils/url';
import { message } from 'antd';

export const uploadFn = createImageUpload({
  onUpload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('_refly_ai_sid='))
      ?.split('=')[1];

    if (!token) {
      message.error('No token found');
      return false;
    }

    const response = await fetch(`${getServerOrigin()}/v1/misc/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      message.error('Upload failed');
      return false;
    }

    const res = await response.json();
    return res.data?.url;
  },
  validateFn: (file) => {
    if (!file.type.includes('image/')) {
      message.error('File type not supported.');
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      message.error('File size too big (max 20MB).');
      return false;
    }
    return true;
  },
});

export const createUploadFn = (param: { entityId: string; entityType: string }) => {
  return createImageUpload({
    onUpload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityId', param.entityId);
      formData.append('entityType', param.entityType);

      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('_refly_ai_sid='))
        ?.split('=')[1];

      if (!token) {
        message.error('No token found');
        return false;
      }

      const response = await fetch(`${getServerOrigin()}/v1/misc/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        message.error('Upload failed');
        return false;
      }

      const res = await response.json();
      return res.data?.url;
    },
    validateFn: (file) => {
      if (!file.type.includes('image/')) {
        message.error('File type not supported.');
        return false;
      }
      if (file.size / 1024 / 1024 > 20) {
        message.error('File size too big (max 20MB).');
        return false;
      }
      return true;
    },
  });
};
