import { createImageUpload } from '@refly-packages/editor-core/plugins';
import { getServerOrigin } from '@refly-packages/utils/url';
import { toast } from 'sonner';

const onUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_refly_ai_sid='))
    ?.split('=')[1];

  if (!token) {
    toast.error('No token found');
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
    toast.error('Upload failed');
    return false;
  }

  const res = await response.json();
  return res.data?.url;
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    if (!file.type.includes('image/')) {
      toast.error('File type not supported.');
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      toast.error('File size too big (max 20MB).');
      return false;
    }
    return true;
  },
});
