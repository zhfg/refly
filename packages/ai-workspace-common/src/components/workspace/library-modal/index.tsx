import { useTranslation } from 'react-i18next';

import { DocumentList } from '../document-list';
import { ResourceList } from '../resource-list';

import { PiNotePencil } from 'react-icons/pi';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';

import { Modal, Tabs } from 'antd';
import './index.scss';

interface LibraryModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const LibraryModal = (props: LibraryModalProps) => {
  const { visible, setVisible } = props;
  const { t } = useTranslation();
  const tabs = [
    {
      key: 'document',
      label: t('common.document'),
      icon: <PiNotePencil style={{ transform: 'translateY(2px)' }} />,
      children: <DocumentList />,
    },
    {
      key: 'resource',
      label: t('common.resource'),
      icon: <HiOutlineSquare3Stack3D style={{ transform: 'translateY(2px)' }} />,
      children: <ResourceList />,
    },
  ];

  return (
    <Modal
      className="library-modal"
      centered
      width={1000}
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
    >
      <Tabs items={tabs} />
    </Modal>
  );
};
