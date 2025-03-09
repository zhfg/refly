import { useParams } from 'react-router-dom';

const ShareCanvasPage = () => {
  const { url = '' } = useParams();

  return <div>hello world {url}</div>;
};

export default ShareCanvasPage;
