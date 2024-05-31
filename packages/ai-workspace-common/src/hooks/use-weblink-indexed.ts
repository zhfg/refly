import { useState, useEffect } from 'react';
import { useMatch } from 'react-router-dom';

import getWebLinkIndexStatus from '@refly-packages/ai-workspace-common/requests/getWebLinkIndexStatus';

export function useWebLinkIndexed() {
  // 标识此网页是否被索引的状态
  const [isWebLinkIndexed, setIsWebLinkIndexed] = useState(false);
  const isHomePage = useMatch('/');

  const getWebsiteIndexStatus = async () => {
    setIsWebLinkIndexed(false);

    const indexRes = await getWebLinkIndexStatus({
      body: {
        url: location.href,
      },
    });

    console.log('weblink index status', indexRes);

    if (indexRes?.data && indexRes?.data?.length > 0) {
      const indexStatus = indexRes?.data?.[0]?.indexStatus === 'finish';

      if (indexStatus) {
        setIsWebLinkIndexed(true);
      }
    }
  };

  // 获取当前打开网页的索引状态
  useEffect(() => {
    getWebsiteIndexStatus();
  }, [isHomePage, location.href]);

  return {
    isWebLinkIndexed,
    setIsWebLinkIndexed,
  };
}
