import { Modal } from 'antd';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { PriceContent } from './priceContent';

export const SubscribeModal = () => {
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
      style={{
        top: 0,
        paddingBottom: 0,
        maxWidth: '100vw',
      }}
      open={visible}
      footer={null}
      className="subscribe-modal !p-0"
      onCancel={() => setVisible(false)}
    >
      <div className="w-full h-full overflow-auto px-[5%]">
        <PriceContent source="modal" />
      </div>
    </Modal>
  );
};
