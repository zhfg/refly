import { useLocation } from 'react-router-dom';

export const usePublicAccessPage = () => {
  const location = useLocation();
  const isSharePage = location?.pathname?.startsWith('/share/') ?? false;
  const isArtifactGalleryPage = location?.pathname?.startsWith('/artifact-gallery') ?? false;
  return isSharePage || isArtifactGalleryPage;
};
