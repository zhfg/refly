import { Modal } from 'antd';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { PriceContent } from './priceContent';

export const SubscribeModal = () => {
  const { t } = useTranslation();

  const { subscribeModalVisible: visible, setSubscribeModalVisible: setVisible } = useSubscriptionStoreShallow(
    (state) => ({
      subscribeModalVisible: state.subscribeModalVisible,
      setSubscribeModalVisible: state.setSubscribeModalVisible,
    }),
  );

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
      <PriceContent />
    </Modal>
  );
};
