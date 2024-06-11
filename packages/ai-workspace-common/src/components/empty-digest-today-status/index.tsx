import { Button } from '@arco-design/web-react';
// assets
import EmptySVG from '@/assets/digest/empty.svg';
// styles
import './index.scss';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { getCurrentDateInfo } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

export const EmptyDigestStatus = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="empty-digest-container">
      <img src={EmptySVG} className="empty-digest-cover" />
      <p className="empty-digest-hint">{t('knowledgeLibrary.empty.archiveTitle')}</p>
      <div className="empty-digest-action-container">
        <Button
          onClick={() => {
            window.open(`https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd`, '_blank');
          }}
        >
          {t('knowledgeLibrary.empty.download')}
        </Button>
        {/* <Button
          style={{ marginLeft: 24 }}
          onClick={() => {
            const { year, day, month } = getCurrentDateInfo()
            navigate(`/digest/daily/${year}/${month}/${day}`)
          }}>
          查看归档
        </Button> */}
      </div>
    </div>
  );
};
