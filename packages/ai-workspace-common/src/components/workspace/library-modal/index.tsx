import { useEffect } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { DocumentList } from '../document-list';
import { ResourceList } from '../resource-list';

import { Canvas } from '@refly/openapi-schema';
import { PiNotePencil } from 'react-icons/pi';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';

import { List, Modal, Button, Tabs } from 'antd';
import { ScrollLoading } from '../scroll-loading';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { LOCALE } from '@refly/common-types';
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
