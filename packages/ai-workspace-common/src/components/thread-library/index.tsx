import { Helmet } from 'react-helmet';
import './index.scss';
// components
import { ConvList } from '@refly-packages/ai-workspace-common/components/conv-list';
import { useTranslation } from 'react-i18next';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { Typography } from '@arco-design/web-react';

export const ConvLibrary = () => {
  const { t } = useTranslation();
  const { jumpToConv } = useJumpNewPath();

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
      <div>{t('tabMeta.threadLibrary.title')}</div>
      <ConvList
        classNames=""
        handleConvItemClick={(convId, projectId) => {
          jumpToConv({
            convId,
            projectId,
          });
        }}
      />
    </div>
  );
};
