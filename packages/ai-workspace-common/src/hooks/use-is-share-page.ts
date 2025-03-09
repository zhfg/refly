import { useLocation } from 'react-router-dom';

export const useIsSharePage = () => {
  const location = useLocation();
  const isSharePage = location?.pathname?.startsWith('/share/') ?? false;
  return isSharePage;
};
