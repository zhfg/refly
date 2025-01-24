import { ResourceType } from '@refly/openapi-schema';
import { IconText } from '@refly-packages/ai-workspace-common/components/common/icon';
import { BsFileRichtext } from 'react-icons/bs';

export const ResourceIcon = (props: { url: string; resourceType: ResourceType; size?: number }) => {
  const { url, resourceType, size = 18 } = props;
  if (url) {
    return (
      <img
        style={{ width: size, height: size }}
        src={`https://www.google.com/s2/favicons?domain=${url}&sz=${size}`}
        alt={url}
      />
    );
  }
  return resourceType === 'text' ? <IconText size={size} /> : <BsFileRichtext size={size} />;
};
