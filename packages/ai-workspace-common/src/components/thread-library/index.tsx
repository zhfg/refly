import { Helmet } from 'react-helmet';
import './index.scss';
// components
import { ConvList } from '@refly-packages/ai-workspace-common/components/conv-list';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const ThreadLibrary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      <ConvList
        classNames=""
        handleConvItemClick={(convId) => {
          navigate(`/knowledge-base?convId=${convId}`);
        }}
      />
    </div>
  );
};
