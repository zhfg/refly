import { useMemo } from 'react';
import { useCookie } from 'react-use';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { getWsServerOrigin } from '@refly-packages/utils/url';

export const useCollabProvider = (documentName: string) => {
  const [token] = useCookie('_refly_ai_sid');

  const websocketProvider = useMemo(() => {
    return new HocuspocusProvider({
      url: getWsServerOrigin(),
      name: documentName,
      token,
    });
  }, [documentName, token]);

  return websocketProvider;
};
