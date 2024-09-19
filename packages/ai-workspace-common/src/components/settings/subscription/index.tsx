import { useState, useEffect } from 'react';

import { Button, Progress, Tooltip, Tag, Spin, Message as message } from '@arco-design/web-react';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { RiBillLine } from 'react-icons/ri';

import { SubscribeModal } from '@refly-packages/ai-workspace-common/components/settings/subscribe-modal';

// styles
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { TokenUsageMeter } from '@refly/openapi-schema';
import dayjs from 'dayjs';

export const Subscription = () => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    userStore?.userProfile?.subscription?.planType || 'free',
  );
  const [subscriptionUsage, setSubscriptionUsage] = useState<TokenUsageMeter>(null);
  const [loading, setLoading] = useState(false);

  const getubscriptionStatus = async () => {
    const { data } = await getClient().getSubscriptionUsage();
    if (data?.data) {
      setSubscriptionUsage(data.data.token);
    }
  };

  const createPortalSession = async () => {
    if (loading) return;
    setLoading(true);
    const { data } = await getClient().createPortalSession();
    if (data?.data?.url) {
      window.location.href = data.data.url;
    } else {
      message.error(t('common.putErr'));
    }
    setLoading(false);
  };

  const UsageItem = ({ title, used, quota, description, endAt }) => {
    const formatNumber = (num) => {
      return num?.toLocaleString() || '0';
    };

    const formatDate = (date) => {
      return dayjs(date).format('YYYY-MM-DD');
    };

    return (
      <div className="subscription-usage-item">
        <div className="subscription-usage-item-title">
          <div className="title">
            <div className="title-left">
              {title}
              <Tooltip mini color="white" content={<div style={{ color: '#000' }}>{description}</div>}>
                <HiOutlineQuestionMarkCircle className="info-icon" />
              </Tooltip>
            </div>
            {quota > 0 && (
              <div className="title-right">
                {t('settings.subscription.subscribe.resetAt', { date: formatDate(endAt) })}
              </div>
            )}
          </div>
        </div>
        <div className="subscription-usage-item-progress">
          <Progress
            color={!quota ? '#C9CDD4' : '#00968F'}
            percent={(used / quota) * 100}
            formatText={() => `${formatNumber(used)} / ${formatNumber(quota)}`}
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
      <div className={`subscription-plan ${subscriptionStatus === 'free' ? 'free' : ''}`}>
        <div className="subscription-plan-info">
          <div className="subscription-plan-info-title">{t('settings.subscription.currentPlan')}</div>
          <div className="subscription-plan-info-status">
            {t(`settings.subscription.subscriptionStatus.${subscriptionStatus}`)}
            {userStore.userProfile?.subscription?.interval && (
              <Tag className="interval" color="blue">
                {t(`settings.subscription.subscribe.${userStore.userProfile?.subscription?.interval}Plan`)}
              </Tag>
            )}
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
          endAt={subscriptionUsage?.endAt}
        />
        <UsageItem
          title={t('settings.subscription.t2TokenUsed')}
          description={t('settings.subscription.t2TokenUsedDescription')}
          used={subscriptionUsage?.t2TokenUsed}
          quota={subscriptionUsage?.t2TokenQuota}
          endAt={subscriptionUsage?.endAt}
        />
      </div>

      {subscriptionStatus !== 'free' && (
        <div className="subscription-management-wrapper">
          <Spin loading={loading} style={{ width: '100%' }}>
            <div className="subscription-management" onClick={createPortalSession}>
              <div className="subscription-management-left">
                <RiBillLine style={{ marginRight: 8 }} />
                {t('settings.subscription.subscriptionManagement')}
              </div>
              <HiOutlineExternalLink className="subscription-management-right" />
            </div>
          </Spin>
        </div>
      )}
      <SubscribeModal visible={subscribeModalVisible} setVisible={setSubscribeModalVisible} />
    </div>
  );
};
