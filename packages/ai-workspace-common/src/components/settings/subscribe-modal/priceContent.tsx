import { useState } from 'react';

import { Button, Divider, Tooltip, Row, Col } from 'antd';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { IconCheck, IconQuestionCircle, IconStar } from '@arco-design/web-react/icon';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { useAuthStoreShallow } from '@refly-packages/ai-workspace-common/stores/auth';
import { SubscriptionPlanType } from '@refly/openapi-schema';

export type PriceLookupKey = 'monthly' | 'yearly';
export type PriceSource = 'page' | 'modal';

const premiumModels = 'GPT-4o, Claude 3.5 Sonnet, Gemini Pro 1.5 and more';
const basicModels = 'GPT-4o Mini, Claude 3 Haiku, Gemini Flash 1.5 and more';
const gridSpan = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 6,
  xl: 6,
  xxl: 4,
};

interface ModelFeatures {
  name: string;
  count?: string;
  details?: string;
  tooltip?: string;
}

const PlanItem = (props: {
  title: SubscriptionPlanType;
  features: ModelFeatures[];
  handleClick?: () => void;
  lookupKey: string;
  loadingInfo: {
    isLoading: boolean;
    plan: string;
  };
}) => {
  const { t } = useTranslation();
  const { title, features, handleClick, lookupKey, loadingInfo } = props;
  const { isLogin } = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
  }));
  const { setLoginModalOpen } = useAuthStoreShallow((state) => ({
    setLoginModalOpen: state.setLoginModalOpen,
  }));
  const [isHovered, setIsHovered] = useState(false);

  const getPrice = (plan: SubscriptionPlanType) => {
    switch (plan) {
      case 'ultra':
        return lookupKey === 'monthly' ? 49.9 : 249.5;
      case 'max':
        return lookupKey === 'monthly' ? 29.9 : 149.5;
      case 'pro':
        return lookupKey === 'monthly' ? 9.9 : 49.5;
      case 'free':
        return 0;
    }
  };

  const getButtonText = (plan: SubscriptionPlanType) => {
    if (isLogin) {
      switch (plan) {
        case 'ultra':
        case 'max':
        case 'pro':
          return t('settings.subscription.subscribe.upgrade');
        case 'free':
          return t('settings.subscription.subscribe.continueFree');
        default:
          return t('settings.subscription.getStarted');
      }
    } else {
      return t('settings.subscription.getStarted');
    }
  };

  const handleButtonClick = () => {
    if (isLogin) {
      handleClick();
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <div className={`w-full h-full flex flex-col ${title === 'max' ? 'pro-plan' : ''}`}>
      <div className="h-[20px] text-center text-xs text-white font-bold">
        {title === 'max' && t('settings.subscription.mostPopular')}
      </div>
      <div
        className={`
        subscribe-content-plans-item
        ${title === 'free' && 'item-free bg-gray-50'}
        ${title === 'ultra' && 'item-ultra bg-[#E8F4FC]'}
        ${title === 'pro' && 'item-pro bg-[#EBF1FF]'}
        ${title === 'max' && 'item-max bg-[#FFF5EB]'}`}
      >
        <div className="subscribe-content-plans-item-title font-extrabold">
          {t(`settings.subscription.subscriptionStatus.${title}`)}
        </div>

        <div className="description">{t(`settings.subscription.subscribe.${title}.description`)}</div>

        <div className="subscribe-content-plans-item-price">
          <span className="price text-3xl">
            {title !== 'free' ? (
              <>
                ${getPrice(title)}
                {lookupKey === 'yearly' && (
                  <span className="text-sm text-gray-500 ml-1">
                    <span className="line-through decoration-gray-700 ">${getPrice(title) * 2}</span>
                  </span>
                )}
              </>
            ) : (
              t('settings.subscription.subscribe.forFree')
            )}
          </span>
          <span className="period !text-xs">
            {' '}
            /{' '}
            {title === 'free' ? (
              t('settings.subscription.subscribe.period')
            ) : (
              <span className="whitespace-nowrap">
                {t(`settings.subscription.subscribe.${lookupKey === 'monthly' ? 'month' : 'firstYear'}`)}
              </span>
            )}
            {title !== 'free' && lookupKey === 'yearly' && '*'}
          </span>
        </div>

        <Button
          className={`subscribe-btn subscribe-btn--${title}`}
          onClick={handleButtonClick}
          loading={loadingInfo.isLoading && loadingInfo.plan === title}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
            <span
              className={`
                inline-flex
                items-center
                justify-center
                w-full
                h-full
                transition-transform duration-300
                absolute
                ${isHovered ? '-translate-y-full' : 'translate-y-0'}
              `}
            >
              {getButtonText(title)}
            </span>
            <span
              className={`
                absolute
                inline-flex
                items-center
                justify-center
                w-full
                h-full
                m-auto
                transition-transform duration-300
                ${isHovered ? 'translate-y-0' : 'translate-y-full'}
              `}
            >
              {getButtonText(title)}
            </span>
          </div>
        </Button>

        <div className="plane-features">
          <Divider className="mt-2 mb-6" />
          {features.map((feature, index) => (
            <div className="plane-features-item" key={index}>
              <div className="text-gray-500">
                <IconCheck style={{ color: 'green', strokeWidth: 6 }} /> {feature.name}
                {feature.tooltip && (
                  <Tooltip title={<div>{feature.tooltip}</div>}>
                    <IconQuestionCircle className="ml-1" />
                  </Tooltip>
                )}
              </div>
              {feature.count && <div className="ml-4 text-sm text-black font-medium">{feature.count}</div>}
              <div className="ml-4 text-xs text-gray-400">{feature.details}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PriceContent = (props: { source: PriceSource }) => {
  const navigate = useNavigate();
  const { source } = props;
  const { t } = useTranslation();
  const { setSubscribeModalVisible: setVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));
  const { setLoginModalOpen } = useAuthStoreShallow((state) => ({
    setLoginModalOpen: state.setLoginModalOpen,
  }));
  const { isLogin } = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
  }));

  const [lookupKey, setLookupKey] = useState<PriceLookupKey>('yearly');
  const [loadingInfo, setLoadingInfo] = useState<{
    isLoading: boolean;
    plan: string;
  }>({
    isLoading: false,
    plan: '',
  });

  const t1ModelName = t('settings.subscription.subscribe.t1Model');
  const t2ModelName = t('settings.subscription.subscribe.t2Model');
  const vectorStorageName = t('settings.subscription.subscribe.vectorStorage');
  const fileStorageName = t('settings.subscription.subscribe.fileStorage');
  const mediaCreditName = t('settings.subscription.subscribe.mediaCredit');
  const modalTooltipContent = t('settings.subscription.subscribe.tooltip.modelToken');
  const vectorStorageTooltipContent = t('settings.subscription.subscribe.tooltip.vectorStorage');
  const fileStorageTooltipContent = t('settings.subscription.subscribe.tooltip.fileStorage');
  const mediaCreditTooltipContent = t('settings.subscription.subscribe.tooltip.mediaCredit');
  const unlimited = t('settings.subscription.subscribe.unlimited');
  const oneTime = t('settings.subscription.subscribe.oneTime');
  const month = t('settings.subscription.subscribe.month');

  const freeFeatures: ModelFeatures[] = [
    {
      name: t2ModelName,
      count: `1M tokens / ${oneTime}`,
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: mediaCreditName,
      count: '5',
      tooltip: mediaCreditTooltipContent,
    },
    {
      name: vectorStorageName,
      count: '10MB',
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: fileStorageName,
      count: '100MB',
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.free.serviceSupport.name'),
      count: t('settings.subscription.subscribe.free.serviceSupport.details'),
    },
  ];

  const proFeatures: ModelFeatures[] = [
    {
      name: t1ModelName,
      count: `0.5M tokens / ${month}`,
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t2ModelName,
      count: `5M tokens / ${month}`,
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: mediaCreditName,
      count: '50',
      tooltip: mediaCreditTooltipContent,
    },
    {
      name: vectorStorageName,
      count: '50MB',
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: fileStorageName,
      count: '500MB',
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.pro.serviceSupport.name'),
      count: t('settings.subscription.subscribe.pro.serviceSupport.details'),
    },
  ];

  const maxFeatures: ModelFeatures[] = [
    {
      name: t1ModelName,
      count: `2M tokens / ${month}`,
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t2ModelName,
      count: unlimited,
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: mediaCreditName,
      count: '100',
      tooltip: mediaCreditTooltipContent,
    },
    {
      name: vectorStorageName,
      count: '100MB',
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: fileStorageName,
      count: '1G',
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.max.serviceSupport.name'),
      count: t('settings.subscription.subscribe.max.serviceSupport.details'),
    },
  ];

  const ultraFeatures: ModelFeatures[] = [
    {
      name: t1ModelName,
      count: unlimited,
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t2ModelName,
      count: unlimited,
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: mediaCreditName,
      count: '500',
      tooltip: mediaCreditTooltipContent,
    },
    {
      name: vectorStorageName,
      count: '500MB',
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: fileStorageName,
      count: '5G',
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.ultra.serviceSupport.name'),
      count: t('settings.subscription.subscribe.ultra.serviceSupport.details'),
    },
  ];

  const createCheckoutSession = async (plan: 'max' | 'pro' | 'ultra') => {
    if (loadingInfo.isLoading) return;
    setLoadingInfo({
      isLoading: true,
      plan,
    });
    const { data } = await getClient().createCheckoutSession({
      body: {
        planType: plan,
        interval: lookupKey,
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

  return (
    <div className="subscribe-content w-full">
      <div className="flex items-center justify-center">
        <div className="text-base ml-1 border border-solid border-yellow-500 rounded-xl px-4 py-1 w-fit mb-4 flex items-center gap-2">
          <span>🎉</span>
          <span className="inline bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:200%_100%] bg-clip-text text-transparent animate-[gradient-animation_1s_ease-in-out_infinite]">
            {t('landingPage.pricing.limitedOffer')}
          </span>
        </div>
      </div>

      <div className="subscribe-content-type">
        <div className="subscribe-content-type-inner">
          <div
            className={`subscribe-content-type-inner-item ${lookupKey === 'yearly' ? 'active' : ''}`}
            onClick={() => setLookupKey('yearly')}
          >
            <span>{t('settings.subscription.subscribe.yearly')}</span>
          </div>

          <div
            className={`subscribe-content-type-inner-item ${lookupKey === 'monthly' ? 'active' : ''}`}
            onClick={() => setLookupKey('monthly')}
          >
            {t('settings.subscription.subscribe.monthly')}
          </div>
        </div>
      </div>

      <Row gutter={[4, 4]} className="subscribe-content-plans" justify="center" align="stretch">
        <Col {...gridSpan}>
          <PlanItem
            title="free"
            features={freeFeatures}
            handleClick={() => {
              isLogin
                ? source === 'modal'
                  ? setVisible(false)
                  : navigate('/', { replace: true })
                : setLoginModalOpen(true);
            }}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />
        </Col>

        <Col {...gridSpan}>
          <PlanItem
            title="pro"
            features={proFeatures}
            handleClick={() => createCheckoutSession('pro')}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />
        </Col>

        <Col {...gridSpan}>
          <PlanItem
            title="max"
            features={maxFeatures}
            handleClick={() => createCheckoutSession('max')}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />
        </Col>

        <Col {...gridSpan}>
          <PlanItem
            title="ultra"
            features={ultraFeatures}
            handleClick={() => createCheckoutSession('ultra')}
            lookupKey={lookupKey}
            loadingInfo={loadingInfo}
          />
        </Col>
      </Row>

      <div className="px-4 text-center text-gray-600 mt-4">
        * {t('settings.subscription.subscribe.firstYearOffCountDescription')}
      </div>

      {isLogin && (
        <div className="subscribe-content-description">
          {t('settings.subscription.subscribe.description')}{' '}
          <a href={`/privacy`} target="_blank" rel="noreferrer">
            {t('settings.subscription.subscribe.privacy')}
          </a>{' '}
          {t('settings.subscription.subscribe.and')}{' '}
          <a href={`/terms`} target="_blank" rel="noreferrer">
            {t('settings.subscription.subscribe.terms')}
          </a>
        </div>
      )}
    </div>
  );
};
