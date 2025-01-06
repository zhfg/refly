import { Button, Modal } from 'antd';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { PriceContent } from './priceContent';
import { IconSubscription } from '@refly-packages/ai-workspace-common/components/common/icon';
import { AiFillInfoCircle } from 'react-icons/ai';

export const SubscribeModal = () => {
  const { t } = useTranslation();
  const { subscribeModalVisible: visible, setSubscribeModalVisible: setVisible } = useSubscriptionStoreShallow(
    (state) => ({
      subscribeModalVisible: state.subscribeModalVisible,
      setSubscribeModalVisible: state.setSubscribeModalVisible,
    }),
  );

  return (
    // <Modal
    //   width={'100vw'}
    //   height={'100vh'}
    //   style={{
    //     top: 0,
    //     paddingBottom: 0,
    //     maxWidth: '100vw',
    //   }}
    //   open={visible}
    //   footer={null}
    //   className="subscribe-modal !p-0"
    //   onCancel={() => setVisible(false)}
    // >
    //   <div className="w-full h-full overflow-auto px-[15%] flex flex-col items-center gap-3">
    //     <div className="font-bold text-3xl m-auto flex items-center gap-2">
    //       <IconSubscription /> {t('settings.subscription.subscribe.title')}
    //     </div>
    //     <PriceContent source="modal" />
    //   </div>
    // </Modal>

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
  );
};
