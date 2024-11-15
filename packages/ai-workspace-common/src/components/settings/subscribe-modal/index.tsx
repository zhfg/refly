import { useState, useEffect } from 'react';

import { Button, Modal, Tooltip } from 'antd';
import { getClientOrigin } from '@refly/utils/url';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { IconCheck, IconQuestionCircle } from '@arco-design/web-react/icon';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { AiFillInfoCircle } from 'react-icons/ai';

interface ModelFeatures {
  name: string;
  count?: string;
  details?: string;
  tooltip?: string;
}

export const SubscribeModal = () => {
  const { t } = useTranslation();

  const { subscribeModalVisible: visible, setSubscribeModalVisible: setVisible } = useSubscriptionStoreShallow(
    (state) => ({
      subscribeModalVisible: state.subscribeModalVisible,
      setSubscribeModalVisible: state.setSubscribeModalVisible,
    }),
  );

  const [lookupKey, setLookupKey] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const proFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.pro.t1Token.name'),
      count: t('settings.subscription.subscribe.pro.t1Token.count'),
      details: 'GPT-4o / Claude 3.5 Sonnet',
      tooltip: t('settings.subscription.subscribe.tooltip.modelToken'),
    },
    {
      name: t('settings.subscription.subscribe.pro.t2Token.name'),
      count: t('settings.subscription.subscribe.pro.t2Token.count'),
      details: 'GPT-4o Mini / Claude 3 Haiku',
      tooltip: t('settings.subscription.subscribe.tooltip.modelToken'),
    },
    {
      name: t('settings.subscription.subscribe.vectorStorage'),
      count: '100MB',
      tooltip: t('settings.subscription.subscribe.tooltip.vectorStorage'),
    },
    {
      name: t('settings.subscription.subscribe.fileStorage'),
      count: '1G',
      tooltip: t('settings.subscription.subscribe.tooltip.fileStorage'),
    },
    {
      name: t('settings.subscription.subscribe.pro.serviceSupport.name'),
      details: t('settings.subscription.subscribe.pro.serviceSupport.details'),
    },
  ];
  const freeFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.free.t2Token.name'),
      count: t('settings.subscription.subscribe.free.t2Token.count'),
      details: 'GPT-4o Mini / Claude 3 Haiku',
      tooltip: t('settings.subscription.subscribe.tooltip.modelToken'),
    },
    {
      name: t('settings.subscription.subscribe.vectorStorage'),
      count: '10MB',
      tooltip: t('settings.subscription.subscribe.tooltip.vectorStorage'),
    },
    {
      name: t('settings.subscription.subscribe.fileStorage'),
      count: '100MB',
      tooltip: t('settings.subscription.subscribe.tooltip.fileStorage'),
    },
    {
      name: t('settings.subscription.subscribe.free.serviceSupport.name'),
      details: t('settings.subscription.subscribe.free.serviceSupport.details'),
    },
  ];

  const createCheckoutSession = async () => {
    if (loading) return;
    setLoading(true);
    const { data } = await getClient().createCheckoutSession({
      body: {
        lookupKey: `refly_pro_${lookupKey}`,
      },
    });
    setLoading(false);
    if (data?.data?.url) {
      window.location.href = data.data.url;
    }
  };

  const PlanItem = (props: {
    title: string;
    price: number;
    isActive: boolean;
    buttonText: string;
    description: string;
    features: ModelFeatures[];
    handleClick: () => void;
  }) => {
    const { title, price, isActive, buttonText, features, description, handleClick } = props;
    return (
      <div className={`subscribe-content-plans-item ${isActive ? 'active' : ''}`}>
        <div className="subscribe-content-plans-item-title">
          {t(`settings.subscription.subscriptionStatus.${title}`)}
        </div>

        <div className="subscribe-content-plans-item-price">
          <span className="price">{title !== 'free' ? `$${price}` : t('settings.subscription.subscribe.forFree')}</span>
          <span className="period">
            {' '}
            /{' '}
            {title === 'free'
              ? t('settings.subscription.subscribe.period')
              : t('settings.subscription.subscribe.month')}
          </span>
        </div>

        <div className="description">{description}</div>

        <Button
          className="subscribe-btn"
          type={isActive ? 'primary' : 'default'}
          onClick={handleClick}
          loading={title === 'pro' && loading}
        >
          {buttonText}
        </Button>

        <div className="plane-features">
          <div className="description">{t('settings.subscription.subscribe.planFeatures')}</div>
          {features.map((feature, index) => (
            <div className="plane-features-item" key={index}>
              <div className="name">
                <IconCheck style={{ color: 'green', strokeWidth: 6 }} /> {feature.name}{' '}
                {feature.count ? ` (${feature.count}) ` : ''}
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

  useEffect(() => {
    if (visible) {
      setLookupKey('monthly');
    }
  }, [visible]);

  return (
    <Modal
      open={visible}
      centered
      onCancel={() => setVisible(false)}
      footer={
        <Button type="primary" onClick={() => setVisible(false)}>
          {t('common.confirm')}
        </Button>
      }
      title={
        <div className="text-lg flex items-center gap-2">
          <AiFillInfoCircle size={22} style={{ color: '#00968F' }} /> {t('settings.subscription.testTipTitle')}
        </div>
      }
    >
      <div className="text-md">{t('settings.subscription.testTip')}</div>
    </Modal>
    // <Modal
    //   width={1080}
    //   height={720}
    //   centered
    //   open={visible}
    //   footer={null}
    //   className="subscribe-modal"
    //   onCancel={() => setVisible(false)}
    // >
    //   <div className="subscribe-content">
    //     <div className="subscribe-content-title">{t('settings.subscription.subscribe.title')}</div>
    //     <div className="subscribe-content-subtitle">{t('settings.subscription.subscribe.subtitle')}</div>

    //     <div className="subscribe-content-type">
    //       <div className="subscribe-content-type-inner">
    //         <div
    //           className={`subscribe-content-type-inner-item ${lookupKey === 'monthly' ? 'active' : ''}`}
    //           onClick={() => setLookupKey('monthly')}
    //         >
    //           {t('settings.subscription.subscribe.monthly')}
    //         </div>
    //         <div
    //           className={`subscribe-content-type-inner-item ${lookupKey === 'yearly' ? 'active' : ''}`}
    //           onClick={() => setLookupKey('yearly')}
    //         >
    //           {t('settings.subscription.subscribe.yearly')}
    //         </div>
    //       </div>
    //     </div>

    //     <div className="subscribe-content-plans">
    //       <PlanItem
    //         title="pro"
    //         price={lookupKey === 'monthly' ? 19.9 : 16.9}
    //         buttonText={t('settings.subscription.subscribe.pro.buttonText')}
    //         description={t('settings.subscription.subscribe.pro.description')}
    //         features={proFeatures}
    //         isActive={true}
    //         handleClick={createCheckoutSession}
    //       />
    //       <PlanItem
    //         title="free"
    //         price={0}
    //         buttonText={t('settings.subscription.subscribe.free.buttonText')}
    //         description={t('settings.subscription.subscribe.free.description')}
    //         features={freeFeatures}
    //         isActive={false}
    //         handleClick={() => {
    //           setVisible(false);
    //         }}
    //       />
    //     </div>
    //   </div>

    //   <div className="subscribe-content-description">
    //     {t('settings.subscription.subscribe.description')}
    //     <a href={`${getClientOrigin(true)}/privacy`} target="_blank" rel="noreferrer">
    //       {t('settings.subscription.subscribe.privacy')}
    //     </a>
    //     {t('settings.subscription.subscribe.and')}
    //     <a href={`${getClientOrigin(true)}/terms`} target="_blank" rel="noreferrer">
    //       {t('settings.subscription.subscribe.terms')}
    //     </a>
    //   </div>
    // </Modal>
  );
};
