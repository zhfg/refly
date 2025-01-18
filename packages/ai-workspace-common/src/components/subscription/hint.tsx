import { memo } from 'react';
import { Button, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconSubscription } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { useSubscriptionUsage } from '@refly-packages/ai-workspace-common/hooks/use-subscription-usage';

export const SubscriptionHint = memo(() => {
  const { t } = useTranslation();
  const { setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));

  const handleUpgrade = () => {
    setSubscribeModalVisible(true);
  };

  const { tokenUsage, storageUsage } = useSubscriptionUsage();

  const requestPercent = ((tokenUsage?.t2CountUsed ?? 0) * 100) / (tokenUsage?.t2CountQuota ?? 1);
  const storagePercent = ((storageUsage?.fileCountUsed ?? 0) * 100) / (storageUsage?.fileCountQuota ?? 1);

  return (
    <div className="w-full rounded-md bg-[#f3f4f8] p-2">
      <div className="mb-1 text-sm font-medium">
        {t('settings.subscription.currentPlan')}：{t(`settings.subscription.subscriptionStatus.free`)}
      </div>
      <div className="-mb-2.5 flex items-center justify-between">
        <div className="text-xs text-gray-500">{t('settings.subscription.t2Requests')}</div>
        <div className="text-xs text-gray-500">
          <span className="text-gray-700">
            {tokenUsage?.t2CountUsed}/{tokenUsage?.t2CountQuota}
          </span>
        </div>
      </div>
      <Progress strokeColor="#00968f" percent={requestPercent} size={{ height: 4 }} showInfo={false} />
      <div className="-mb-2.5 flex items-center justify-between">
        <div className="text-xs text-gray-500">{t('settings.subscription.fileCount')}</div>
        <div className="text-xs text-gray-500">
          <span className="text-gray-700">
            {storageUsage?.fileCountUsed}/{storageUsage?.fileCountQuota}
          </span>
        </div>
      </div>
      <Progress strokeColor="#00968f" percent={storagePercent} size={{ height: 4 }} showInfo={false} />
      <div className="mt-2 flex justify-center">
        <Button
          className="w-full"
          type="primary"
          size="middle"
          icon={<IconSubscription className="flex items-center justify-center text-base" />}
          onClick={handleUpgrade}
        >
          <span className="text-sm">{t('settings.subscription.subscribeNow')}</span>
        </Button>
      </div>
    </div>
  );
});

SubscriptionHint.displayName = 'SubscriptionHint';
