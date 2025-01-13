import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Button, Progress, Tooltip, Tag, Space } from 'antd';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { RiBillLine } from 'react-icons/ri';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { formatStorage } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';

import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';

// styles
import './index.scss';
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { StorageUsageMeter } from '@refly/openapi-schema';

import { PiInvoiceBold } from 'react-icons/pi';
import { IconSubscription } from '@refly-packages/ai-workspace-common/components/common/icon';

const UsageItem = ({
  title,
  used,
  quota,
  description,
  type,
  endAt,
}: {
  title: string;
  used: number;
  quota: number;
  description: string;
  type: string;
  endAt?: string;
}) => {
  const { t } = useTranslation();
  const formatNumber = (num: number) => {
    if (num < 0) {
      return '∞';
    }
    if (type === 'vectorStorage') {
      return formatStorage(num);
    }
    return num?.toLocaleString() || '0';
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY-MM-DD');
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
          strokeColor={!quota ? '#C9CDD4' : '#00968F'}
          percent={(used / quota) * 100}
          showInfo={false}
        />
      </div>
    </div>
  );
};

const FileStorageUsageItem = (props: { storage: StorageUsageMeter }) => {
  const { t } = useTranslation();
  const { storage } = props;
  const canvasSize = Number(storage?.canvasSize || 0);
  const resourceSize = Number(storage?.resourceSize || 0);
  const fileSize = Number(storage?.fileSize || 0);

  const used = canvasSize + resourceSize + fileSize;
  const total = Number(storage?.objectStorageQuota || 0);

  const notePercentage = total > 0 ? (canvasSize / total) * 100 : 0;
  const resourcePercentage = total > 0 ? (resourceSize / total) * 100 : 0;
  const knowledgePercentage = total > 0 ? (fileSize / total) * 100 : 0;

  const categories = [
    {
      name: t('settings.subscription.subscribe.fileStorageType.note'),
      color: '#fa5163',
      percentage: notePercentage,
    },
    {
      name: t('settings.subscription.subscribe.fileStorageType.resource'),
      color: '#915dcf',
      percentage: resourcePercentage,
    },
    {
      name: t('settings.subscription.subscribe.fileStorageType.file'),
      color: '#ffbf00',
      percentage: knowledgePercentage,
    },
  ].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="file-storage-usage-bar">
      <div className="file-storage-usage-bar-title">
        <span className="title-left">
          {t('settings.subscription.subscribe.fileStorage')}
          <Tooltip
            color="white"
            title={<div style={{ color: '#000' }}>{t('settings.subscription.subscribe.tooltip.fileStorage')}</div>}
          >
            <HiOutlineQuestionMarkCircle className="info-icon" />
          </Tooltip>
        </span>
        <span className="title-right">
          {formatStorage(used)} / {formatStorage(total)}
        </span>
      </div>
      <div className="file-storage-usage-bar-progress">
        {categories.map((category, index) => (
          <div
            key={index}
            style={{ width: `${category.percentage}%`, height: '100%', backgroundColor: category.color }}
          />
        ))}
      </div>
      <Space size="middle" style={{ marginTop: '8px' }}>
        {categories.map((category, index) => (
          <div key={index} className="file-storage-usage-bar-category">
            <div
              className="file-storage-usage-bar-category-dot"
              style={{
                backgroundColor: category.color,
              }}
            />
            <span className="file-storage-usage-bar-category-name">{category.name}</span>
          </div>
        ))}
      </Space>
    </div>
  );
};

export const Subscription = () => {
  const { t } = useTranslation();
  const userStore = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
  }));

  const {
    isRequest,
    setIsRequest,
    setSubscribeModalVisible,
    subscriptionStatus,
    setSubscriptionStatus,
    tokenUsage,
    setTokenUsage,
    storageUsage,
    setStorageUsage,
  } = useSubscriptionStoreShallow((state) => ({
    isRequest: state.isRequest,
    setIsRequest: state.setIsRequest,
    setSubscribeModalVisible: state.setSubscribeModalVisible,
    subscriptionStatus: state.subscriptionStatus,
    setSubscriptionStatus: state.setSubscriptionStatus,
    tokenUsage: state.tokenUsage,
    setTokenUsage: state.setTokenUsage,
    storageUsage: state.storageUsage,
    setStorageUsage: state.setStorageUsage,
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
    setSubscriptionStatus(userStore?.userProfile?.subscription?.planType || 'free');
  }, [userStore?.userProfile?.subscription?.planType]);

  useEffect(() => {
    getSubscriptionStatus();
  }, []);

  return (
    <Spin spinning={isRequest}>
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
          {subscriptionStatus === 'free' ? (
            <Button
              type="primary"
              className="subscribe-btn"
              icon={<IconSubscription className="flex items-center justify-center text-base" />}
              onClick={() => {
                setSubscribeModalVisible(true);
              }}
            >
              {t('settings.subscription.subscribeNow')}
            </Button>
          ) : (
            <Button
              type="default"
              className="text-gray-500 font-medium border-none shadow-lg"
              loading={portalLoading}
              onClick={createPortalSession}
              icon={<PiInvoiceBold className="flex items-center justify-center text-base" />}
            >
              {t('settings.subscription.manage')}
            </Button>
          )}
        </div>

        <div className="subscription-usage">
          <UsageItem
            title={t('settings.subscription.t1TokenUsed')}
            description={t('settings.subscription.t1TokenUsedDescription')}
            used={tokenUsage?.t1TokenUsed}
            quota={tokenUsage?.t1TokenQuota}
            endAt={tokenUsage?.endAt}
            type="t1Token"
          />
          <UsageItem
            title={t('settings.subscription.t2TokenUsed')}
            description={t('settings.subscription.t2TokenUsedDescription')}
            used={tokenUsage?.t2TokenUsed}
            quota={tokenUsage?.t2TokenQuota}
            endAt={tokenUsage?.endAt}
            type="t2Token"
          />
          <UsageItem
            title={t('settings.subscription.subscribe.vectorStorage')}
            description={t('settings.subscription.subscribe.tooltip.vectorStorage')}
            used={parseFloat(storageUsage?.vectorStorageUsed)}
            quota={parseFloat(storageUsage?.vectorStorageQuota)}
            type="vectorStorage"
          />
          <FileStorageUsageItem storage={storageUsage} />
        </div>
      </div>
    </Spin>
  );
};
