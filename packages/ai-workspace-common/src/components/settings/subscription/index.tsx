import { useState, useEffect } from 'react';

import { Button, Progress, Tooltip, Tag, Spin, Message as message, Skeleton, Space } from '@arco-design/web-react';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { RiBillLine } from 'react-icons/ri';

import { SubscribeModal } from '@refly-packages/ai-workspace-common/components/settings/subscribe-modal';

// styles
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { TokenUsageMeter, StorageUsageMeter } from '@refly/openapi-schema';
import dayjs from 'dayjs';

export const Subscription = () => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    userStore?.userProfile?.subscription?.planType || 'free',
  );
  const [subscriptionUsage, setSubscriptionUsage] = useState<TokenUsageMeter>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsageMeter>(null);
  const [loading, setLoading] = useState(false);
  const [isRequest, setIsRequest] = useState(false);

  const getSubscriptionStatus = async () => {
    setIsRequest(true);
    const { data } = await getClient().getSubscriptionUsage();
    if (data?.data) {
      setSubscriptionUsage(data.data.token);
      setStorageUsage(data.data.storage);
    }
    setIsRequest(false);
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

  const formatStorage = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (numValue < 1024) {
      return `${numValue} B`;
    } else if (numValue < 1024 * 1024) {
      return `${(numValue / 1024).toFixed(2)} KB`;
    } else if (numValue < 1024 * 1024 * 1024) {
      return `${(numValue / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(numValue / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  const UsageItem = ({ title, used, quota, description, type, endAt = null }) => {
    const formatNumber = (num) => {
      if (type === 'vectorStorage') {
        return formatStorage(num);
      }
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
            color={!quota ? '#C9CDD4' : '#00968F'}
            percent={(used / quota) * 100}
            showText={false}
          />
        </div>
      </div>
    );
  };

  const FileStorageUsageItem = (props: { storage: StorageUsageMeter }) => {
    const { storage } = props;
    const noteSize = Number(storage?.noteSize || 0);
    const resourceSize = Number(storage?.resourceSize || 0);
    const fileSize = Number(storage?.fileSize || 0);

    const used = noteSize + resourceSize + fileSize;
    const total = Number(storage?.objectStorageQuota || 0);

    const notePercentage = (noteSize / total) * 100;
    const resourcePercentage = (resourceSize / total) * 100;
    const knowledgePercentage = (fileSize / total) * 100;

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
    ];

    return (
      <div className="file-storage-usage-bar">
        <div className="file-storage-usage-bar-title">
          <span className="title-left">
            {t('settings.subscription.subscribe.fileStorage')}
            <Tooltip
              mini
              color="white"
              content={<div style={{ color: '#000' }}>{t('settings.subscription.subscribe.tooltip.fileStorage')}</div>}
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
        <Space size="large" style={{ marginTop: '8px' }}>
          {categories.map((category, index) => (
            <div key={index} className="file-storage-usage-bar-category">
              <div
                className="file-storage-usage-bar-category-dot"
                style={{
                  backgroundColor: category.color,
                }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </Space>
      </div>
    );
  };

  useEffect(() => {
    setSubscriptionStatus(userStore?.userProfile?.subscription?.planType || 'free');
  }, [userStore?.userProfile?.subscription?.planType]);

  useEffect(() => {
    getSubscriptionStatus();
  }, []);

  return (
    <div className="subscription">
      {isRequest ? (
        <>
          <Skeleton style={{ marginBottom: 12 }}></Skeleton>
          <Skeleton></Skeleton>
        </>
      ) : (
        <>
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
              type="t1Token"
            />
            <UsageItem
              title={t('settings.subscription.t2TokenUsed')}
              description={t('settings.subscription.t2TokenUsedDescription')}
              used={subscriptionUsage?.t2TokenUsed}
              quota={subscriptionUsage?.t2TokenQuota}
              endAt={subscriptionUsage?.endAt}
              type="t2Token"
            />
            <UsageItem
              title={t('settings.subscription.subscribe.vectorStorage')}
              description={t('settings.subscription.subscribe.tooltip.vectorStorage')}
              used={storageUsage?.vectorStorageUsed}
              quota={storageUsage?.vectorStorageQuota}
              type="vectorStorage"
            />
            <FileStorageUsageItem storage={storageUsage} />
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
        </>
      )}

      <SubscribeModal visible={subscribeModalVisible} setVisible={setSubscribeModalVisible} />
    </div>
  );
};
