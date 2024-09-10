import { useState, useEffect } from 'react';

import { Button, Progress, Tooltip } from '@arco-design/web-react';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { HiOutlineExternalLink } from 'react-icons/hi';

import { SubscribeModal } from '@refly-packages/ai-workspace-common/components/settings/subscribe-modal';

// styles
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { UsageMeter } from '@refly/openapi-schema';

export const Subscription = () => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    userStore?.userProfile?.subscription?.planType || 'free',
  );
  const [subscriptionUsage, setSubscriptionUsage] = useState<UsageMeter>(null);

  const getubscriptionStatus = async () => {
    const { data } = await getClient().getSubscriptionUsage();
    if (data?.data) {
      setSubscriptionUsage(data.data);
    }
  };

  const createPortalSession = async () => {
    const { error } = await getClient().createPortalSession();
    if (error) {
      console.error(error);
      return;
    }
  };

  const UsageItem = ({ title, used, quota, description }) => {
    return (
      <div className="subscription-usage-item">
        <div className="subscription-usage-item-title">
          <div className="title">
            <span>{title}</span>
            <Tooltip content={description}>
              <HiOutlineQuestionMarkCircle className="info-icon" />
            </Tooltip>
          </div>
        </div>
        <div className="subscription-usage-item-progress">
          <Progress
            color={!quota ? '#C9CDD4' : '#00968F'}
            percent={(used / quota) * 100}
            formatText={() => `${used} / ${quota}`}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    setSubscriptionStatus(userStore?.userProfile?.subscription?.planType || 'free');
  }, [userStore?.userProfile?.subscription?.planType]);

  useEffect(() => {
    getubscriptionStatus();
  }, []);

  return (
    <div className="subscription">
      <div className="subscription-plan">
        <div className="subscription-plan-info">
          <div className="subscription-plan-info-title">{t('settings.subscription.currentPlan')}</div>
          <div className="subscription-plan-info-status">
            {t(`settings.subscription.subscriptionStatus.${subscriptionStatus}`)}
          </div>
        </div>
        {subscriptionStatus === 'free' && (
          <Button type="primary" className="subscribe-btn" onClick={() => setSubscribeModalVisible(true)}>
            {t('settings.subscription.subscribeNow')}
          </Button>
        )}
      </div>

      <div className="subscription-usage">
        <UsageItem
          title={t('settings.subscription.t1TokenUsed')}
          description={t('settings.subscription.t1TokenUsedDescription')}
          used={subscriptionUsage?.t1TokenUsed}
          quota={subscriptionUsage?.t1TokenQuota}
        />
        <UsageItem
          title={t('settings.subscription.t2TokenUsed')}
          description={t('settings.subscription.t2TokenUsedDescription')}
          used={subscriptionUsage?.t2TokenUsed}
          quota={subscriptionUsage?.t2TokenQuota}
        />
      </div>

      {subscriptionStatus !== 'free' && (
        <div className="subscription-management" onClick={createPortalSession}>
          <div className="subscription-management-left">{t('settings.subscription.subscriptionManagement')}</div>
          <HiOutlineExternalLink className="subscription-management-right" />
        </div>
      )}
      <SubscribeModal visible={subscribeModalVisible} setVisible={setSubscribeModalVisible} />
    </div>
  );
};
