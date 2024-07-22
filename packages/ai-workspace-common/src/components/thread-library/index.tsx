import { Helmet } from 'react-helmet';
import './index.scss';
// components
import { ConvList } from '@refly-packages/ai-workspace-common/components/conv-list';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

interface ThreadLibraryProps {
  handleItemClick: (convId: string) => void;
}

export const ThreadLibrary = (props: ThreadLibraryProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { jumpToConv } = useKnowledgeBaseJumpNewPath();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* <Header /> */}
      <Helmet>
        <title>
          {t('productName')} | {t('tabMeta.threadLibrary.title')}
        </title>
      </Helmet>
      <ConvList classNames="" handleConvItemClick={props.handleItemClick} />
    </div>
  );
};
