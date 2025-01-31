import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button, Progress, Tooltip, Tag } from 'antd';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';

import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';

// styles
import './index.scss';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { PiInvoiceBold } from 'react-icons/pi';
import { IconSubscription } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD');
};

const UsageItem = ({
  title,
  used,
  quota,
  description,
  endAt,
}: {
  title: string;
  used: number;
  quota: number;
  description: string;
  endAt?: string;
}) => {
  const { t } = useTranslation();
  const formatNumber = (num: number) => {
    if (num < 0) {
      return '∞';
    }
    return num?.toLocaleString() || '0';
  };

  return (
    <div className="subscription-usage-item">
      <div className="subscription-usage-item-title">
        <div className="title">
          <div className="title-left">
            {title}
            <Tooltip color="white" title={<div style={{ color: '#000' }}>{description}</div>}>
              <HiOutlineQuestionMarkCircle className="info-icon" />
            </Tooltip>
          </div>
          <div className="title-right">
            {`${formatNumber(used)} / ${formatNumber(quota)}`}
            {quota > 0 && endAt && (
              <div style={{ fontSize: 10, textAlign: 'right', marginTop: 2 }}>
                {t('settings.subscription.subscribe.resetAt', { date: formatDate(endAt) })}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="subscription-usage-item-progress">
        <Progress
          strokeWidth={10}
          strokeColor={quota >= 0 && used >= quota ? '#dc2626' : '#00968F'}
          percent={(used / quota) * 100}
          showInfo={false}
        />
      </div>
    </div>
  );
};

export const Subscription = () => {
  const { t } = useTranslation();
  const { userProfile } = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
  }));
  const { subscription, customerId } = userProfile ?? {};

  const {
    isRequest,
    setIsRequest,
    setSubscribeModalVisible,
    planType,
    setPlanType,
    tokenUsage,
    setTokenUsage,
    storageUsage,
    setStorageUsage,
  } = useSubscriptionStoreShallow((state) => ({
    isRequest: state.isRequest,
    setIsRequest: state.setIsRequest,
    setSubscribeModalVisible: state.setSubscribeModalVisible,
    planType: state.planType,
    setPlanType: state.setPlanType,
    tokenUsage: state.tokenUsage,
    setTokenUsage: state.setTokenUsage,
    storageUsage: state.storageUsage,
    setStorageUsage: state.setStorageUsage,
  }));

  const { setShowSettingModal } = useSiderStoreShallow((state) => ({
    setShowSettingModal: state.setShowSettingModal,
  }));

  const getSubscriptionStatus = async () => {
    const { userProfile } = useUserStore.getState();
    if (!userProfile) return;

    setIsRequest(true);
    const { data } = await getClient().getSubscriptionUsage();
    if (data?.data) {
      setTokenUsage(data.data.token);
      setStorageUsage(data.data.storage);
    }
    setIsRequest(false);
  };

  const [portalLoading, setPortalLoading] = useState(false);
  const createPortalSession = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    const { data } = await getClient().createPortalSession();
    setPortalLoading(false);
    if (data?.data?.url) {
      window.location.href = data.data.url;
    }
  };

  useEffect(() => {
    setPlanType(subscription?.planType || 'free');
  }, [subscription?.planType, setPlanType]);

  useEffect(() => {
    getSubscriptionStatus();
  }, []);

  const hintTag = useMemo(() => {
    if (planType === 'free') return null;
    if (subscription?.cancelAt) {
      return (
        <Tag className="interval" color="orange">
          {t('settings.subscription.subscribe.cancelAt', {
            date: formatDate(subscription?.cancelAt),
          })}
        </Tag>
      );
    }
    return (
      <Tag className="interval" color="blue">
        {t(`settings.subscription.subscribe.${subscription?.interval}Plan`)}
      </Tag>
    );
  }, [t, planType, subscription?.interval, subscription?.cancelAt]);

  return (
    <Spin spinning={isRequest}>
      <div className="subscription">
        <div className={`subscription-plan ${planType === 'free' ? 'free' : ''}`}>
          <div className="subscription-plan-info">
            <div className="subscription-plan-info-title">
              {t('settings.subscription.currentPlan')}
            </div>
            <div className="subscription-plan-info-status">
              {t(`settings.subscription.subscriptionStatus.${planType}`)}
              {hintTag}
            </div>
          </div>
          {planType === 'free' ? (
            <Button
              type="primary"
              className="subscribe-btn"
              icon={<IconSubscription className="flex items-center justify-center text-base" />}
              onClick={() => {
                setShowSettingModal(false);
                setSubscribeModalVisible(true);
              }}
            >
              {t('settings.subscription.subscribeNow')}
            </Button>
          ) : (
            customerId && (
              <Button
                type="default"
                className="text-gray-500 font-medium border-none shadow-lg"
                loading={portalLoading}
                onClick={createPortalSession}
                icon={<PiInvoiceBold className="flex items-center justify-center text-base" />}
              >
                {t('settings.subscription.manage')}
              </Button>
            )
          )}
        </div>

        <div className="subscription-usage">
          <UsageItem
            title={t('settings.subscription.t1Requests')}
            description={t('settings.subscription.t1RequestsDescription')}
            used={tokenUsage?.t1CountUsed}
            quota={tokenUsage?.t1CountQuota}
            endAt={tokenUsage?.endAt}
          />
          <UsageItem
            title={t('settings.subscription.t2Requests')}
            description={t('settings.subscription.t2RequestsDescription')}
            used={tokenUsage?.t2CountUsed}
            quota={tokenUsage?.t2CountQuota}
            endAt={tokenUsage?.endAt}
          />
          <UsageItem
            title={t('settings.subscription.fileCount')}
            description={t('settings.subscription.fileCountDescription')}
            used={storageUsage?.fileCountUsed}
            quota={storageUsage?.fileCountQuota}
          />
        </div>
      </div>
    </Spin>
  );
};
