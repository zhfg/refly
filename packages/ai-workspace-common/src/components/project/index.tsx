import { useSearchParams } from 'react-router-dom';
import { Canvas } from '../canvas';

export const Project = ({ projectId }: { projectId: string }) => {
  const [searchParams] = useSearchParams();
  const canvasId = searchParams.get('canvasId');
  console.log('projectId', projectId);

  return <Canvas canvasId={canvasId} />;
};
