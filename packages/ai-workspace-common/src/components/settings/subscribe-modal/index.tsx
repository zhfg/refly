import { useState, useEffect } from 'react';

import { Button, Modal, Tooltip } from 'antd';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { IconCheck, IconQuestionCircle } from '@arco-design/web-react/icon';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';

const premiumModels = 'GPT-4o / Claude 3.5 Sonnet / Gemini Pro 1.5';
const basicModels = 'GPT-4o Mini / Claude 3 Haiku / Gemini Flash 1.5';

interface ModelFeatures {
  name: string;
  details?: string;
  tooltip?: string;
}

const PlanItem = (props: {
  title: 'max' | 'pro' | 'plus' | 'free';
  isActive: boolean;
  description: string;
  features: ModelFeatures[];
  handleClick?: () => void;
  lookupKey: string;
  loadingInfo: {
    isLoading: boolean;
    plan: string;
  };
}) => {
  const { t } = useTranslation();
  const { title, isActive, features, description, handleClick, lookupKey, loadingInfo } = props;

  const getPrice = (plan: 'max' | 'pro' | 'plus' | 'free') => {
    switch (plan) {
      case 'max':
        return lookupKey === 'monthly' ? 29.9 : 299;
      case 'pro':
        return lookupKey === 'monthly' ? 9.9 : 99;
      case 'plus':
        return lookupKey === 'monthly' ? 4.9 : 49;
      case 'free':
        return 0;
    }
  };

  const getButtonText = (plan: 'max' | 'pro' | 'plus' | 'free') => {
    switch (plan) {
      case 'max':
      case 'pro':
      case 'plus':
        return t('settings.subscription.subscribe.upgrade');
      case 'free':
        return t('settings.subscription.subscribe.continueFree');
    }
  };

  return (
    <div className={`subscribe-content-plans-item ${isActive ? 'active' : ''}`}>
      <div className="subscribe-content-plans-item-title">{t(`settings.subscription.subscriptionStatus.${title}`)}</div>

      <div className="subscribe-content-plans-item-price">
        <span className="price">
          {title !== 'free' ? `$${getPrice(title)}` : t('settings.subscription.subscribe.forFree')}
        </span>
        <span className="period">
          {' '}
          /{' '}
          {title === 'free'
            ? t('settings.subscription.subscribe.period')
            : t(`settings.subscription.subscribe.${lookupKey === 'monthly' ? 'month' : 'year'}`)}
        </span>
      </div>

      <div className="description">{description}</div>

      <Button
        className="subscribe-btn"
        type={isActive ? 'primary' : 'default'}
        onClick={handleClick}
        loading={loadingInfo.isLoading && loadingInfo.plan === title}
      >
        {getButtonText(title)}
      </Button>

      <div className="plane-features">
        <div className="description">{t('settings.subscription.subscribe.planFeatures')}</div>
        {features.map((feature, index) => (
          <div className="plane-features-item" key={index}>
            <div className="name">
              <IconCheck style={{ color: 'green', strokeWidth: 6 }} /> {feature.name}
              {feature.tooltip && (
                <Tooltip title={<div>{feature.tooltip}</div>}>
                  <IconQuestionCircle />
                </Tooltip>
              )}
            </div>
            <div className="details">{feature.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SubscribeModal = () => {
  const { t } = useTranslation();

  const { subscribeModalVisible: visible, setSubscribeModalVisible: setVisible } = useSubscriptionStoreShallow(
    (state) => ({
      subscribeModalVisible: state.subscribeModalVisible,
      setSubscribeModalVisible: state.setSubscribeModalVisible,
    }),
  );

  const [lookupKey, setLookupKey] = useState<'monthly' | 'yearly'>('yearly');
  const [loadingInfo, setLoadingInfo] = useState<{
    isLoading: boolean;
    plan: string;
  }>({
    isLoading: false,
    plan: '',
  });

  const modalTooltipContent = t('settings.subscription.subscribe.tooltip.modelToken');
  const vectorStorageTooltipContent = t('settings.subscription.subscribe.tooltip.vectorStorage');
  const fileStorageTooltipContent = t('settings.subscription.subscribe.tooltip.fileStorage');

  const freeFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t2ModalOneTime', { tokenCount: '1,000,000' }),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (10MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.fileStorage')} (100MB)`,
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.free.serviceSupport.name'),
      details: t('settings.subscription.subscribe.free.serviceSupport.details'),
    },
  ];

  const plusFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t1ModalMonthly', { tokenCount: '500,000' }),
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.t2ModalMonthly', { tokenCount: '5,000,000' }),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (50MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.fileStorage')} (500MB)`,
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.plus.serviceSupport.name'),
      details: t('settings.subscription.subscribe.plus.serviceSupport.details'),
    },
  ];

  const proFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t1ModalMonthly', { tokenCount: '1,000,000' }),
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.t2ModalUnlimited'),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (100MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.fileStorage')} (1G)`,
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.pro.serviceSupport.name'),
      details: t('settings.subscription.subscribe.pro.serviceSupport.details'),
    },
  ];

  const maxFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t1ModalUnlimited'),
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.t2ModalUnlimited'),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (500MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.fileStorage', { storage: '5G' }),
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.max.serviceSupport.name'),
      details: t('settings.subscription.subscribe.max.serviceSupport.details'),
    },
  ];

  const createCheckoutSession = async (plan: 'max' | 'pro' | 'plus') => {
    if (loadingInfo.isLoading) return;
    setLoadingInfo({
      isLoading: true,
      plan,
    });
    const { data } = await getClient().createCheckoutSession({
      body: {
        lookupKey: `refly_${plan}_${lookupKey}`,
      },
    });
    setLoadingInfo({
      isLoading: false,
      plan: '',
    });
    if (data?.data?.url) {
      window.location.href = data.data.url;
    }
  };

  useEffect(() => {
    if (visible) {
      setLookupKey('yearly');
    }
  }, [visible]);

  return (
    <Modal
      width={'100vw'}
      height={'100vh'}
      centered
      open={visible}
      footer={null}
      className="subscribe-modal"
      onCancel={() => setVisible(false)}
    >
      <div className="subscribe-content">
        <div className="subscribe-content-title">{t('settings.subscription.subscribe.title')}</div>
        <div className="subscribe-content-subtitle">{t('settings.subscription.subscribe.subtitle')}</div>

        <div className="subscribe-content-type">
          <div className="subscribe-content-type-inner">
            <div
              className={`subscribe-content-type-inner-item ${lookupKey === 'yearly' ? 'active' : ''}`}
              onClick={() => setLookupKey('yearly')}
            >
              {t('settings.subscription.subscribe.yearly')}
            </div>

            <div
              className={`subscribe-content-type-inner-item ${lookupKey === 'monthly' ? 'active' : ''}`}
              onClick={() => setLookupKey('monthly')}
            >
              {t('settings.subscription.subscribe.monthly')}
            </div>
          </div>
        </div>

        <div className="subscribe-content-plans">
          <PlanItem
            title="free"
            description={t('settings.subscription.subscribe.free.description')}
            features={freeFeatures}
            isActive={false}
            handleClick={() => {
              setVisible(false);
            }}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />

          <PlanItem
            title="plus"
            description={t('settings.subscription.subscribe.plus.description')}
            features={plusFeatures}
            isActive={true}
            handleClick={() => createCheckoutSession('plus')}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />

          <PlanItem
            title="pro"
            description={t('settings.subscription.subscribe.pro.description')}
            features={proFeatures}
            isActive={true}
            handleClick={() => createCheckoutSession('pro')}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />

          <PlanItem
            title="max"
            description={t('settings.subscription.subscribe.max.description')}
            features={maxFeatures}
            isActive={true}
            handleClick={() => createCheckoutSession('max')}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />
        </div>
      </div>

      <div className="subscribe-content-description">
        {t('settings.subscription.subscribe.description')}
        <a href={`/privacy`} target="_blank" rel="noreferrer">
          {t('settings.subscription.subscribe.privacy')}
        </a>
        {t('settings.subscription.subscribe.and')}
        <a href={`/terms`} target="_blank" rel="noreferrer">
          {t('settings.subscription.subscribe.terms')}
        </a>
      </div>
    </Modal>
  );
};
