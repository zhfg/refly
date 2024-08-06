import { useContentSelector } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector';
import './App.scss';

export const App = () => {
  const { contentSelectorElem } = useContentSelector();

  return <div>{}</div>;
};
