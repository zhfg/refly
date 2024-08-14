import { safeParseURL } from '@refly-packages/utils/url';
import { useMemo } from 'react';

export const MemorizedImgIcon = (props: { url: string }) => {
  const { url } = props;

  const icon = useMemo(() => {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${safeParseURL(`${url}` as string)}&sz=${32}`}
        alt={`${url}`}
      />
    );
  }, [url]);

  return icon;
};
