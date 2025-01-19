import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { List, Card, Dropdown, Button, Popconfirm, message, Empty, Tooltip } from 'antd';
import type { MenuProps, DropdownProps } from 'antd';
import { IconMoreHorizontal, IconEdit, IconDelete } from '@refly-packages/ai-workspace-common/components/common/icon';

import { useEffect, useState } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { LOCALE } from '@refly/common-types';
import { useTranslation } from 'react-i18next';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { Resource } from '@refly/openapi-schema';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useSubscriptionUsage } from '@refly-packages/ai-workspace-common/hooks/use-subscription-usage';

const { Meta } = Card;

const ActionView = ({ resource }: { resource: Resource }) => {
  const { t } = useTranslation();
  const { addNode } = useAddNode();
  const { setShowLibraryModal } = useSiderStoreShallow((state) => ({
    setShowLibraryModal: state.setShowLibraryModal,
  }));

  const handleEdit = (resource: Resource) => {
    addNode({
      type: 'resource',
      data: {
        title: resource.title,
        entityId: resource.resourceId,
        contentPreview: resource.contentPreview,
      },
    });
    setShowLibraryModal(false);
  };

  return (
    <Tooltip title={t('workspace.addToCanvas')}>
      <Button type="text" icon={<IconEdit />} onClick={() => handleEdit(resource)} />
    </Tooltip>
  );
};

const ActionDropdown = ({ resource }: { resource: Resource }) => {
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const { refetchUsage } = useSubscriptionUsage();
  const { getLibraryList } = useHandleSiderData();
  const { dataList, setDataList } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listResources({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  const handleDelete = async () => {
    const { data } = await getClient().deleteResource({
      body: {
        resourceId: resource.resourceId,
      },
    });
    if (data?.success) {
      message.success(t('common.putSuccess'));
      refetchUsage();
      setDataList(dataList.filter((n) => n.resourceId !== resource.resourceId));
      getLibraryList();
    }
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <Popconfirm
          title={t('workspace.deleteDropdownMenu.deleteConfirmForResource')}
          onConfirm={handleDelete}
          onCancel={() => setPopupVisible(false)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <div className="flex items-center text-red-600">
            <IconDelete size={16} className="mr-2" />
            {t('workspace.deleteDropdownMenu.delete')}
          </div>
        </Popconfirm>
      ),
      key: 'delete',
    },
  ];

  const handleOpenChange: DropdownProps['onOpenChange'] = (open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  };

  return (
    <Dropdown
      trigger={['click']}
      open={popupVisible}
      onOpenChange={handleOpenChange}
      menu={{
        items,
      }}
    >
      <Button type="text" icon={<IconMoreHorizontal />} />
    </Dropdown>
  );
};

export const ResourceList = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const { showLibraryModal } = useSiderStoreShallow((state) => ({
    showLibraryModal: state.showLibraryModal,
  }));

  const { dataList, loadMore, reload, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listResources({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  useEffect(() => {
    if (showLibraryModal) {
      reload();
    }
  }, [showLibraryModal]);

  return (
    <div className="w-full px-[8px] h-[calc(50vh-60px)] overflow-y-auto">
      {isRequesting || dataList.length > 0 ? (
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 4,
            xxl: 4,
          }}
          dataSource={dataList}
          locale={{ emptyText: t('common.empty') }}
          loading={isRequesting}
          loadMore={
            dataList.length > 0 ? (
              <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
            ) : null
          }
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                cover={<div className="h-[100px] bg-gray-200"></div>}
                actions={[<ActionView key="view" resource={item} />, <ActionDropdown resource={item} key="ellipsis" />]}
              >
                <Meta
                  title={item.title || t('common.unTitle')}
                  description={
                    <div className="text-xs text-black/40">
                      {time(item.updatedAt, language as LOCALE)
                        .utc()
                        .fromNow()}
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        ></List>
      ) : (
        <div className="h-full flex items-center justify-center">
          <Empty description={t('common.empty')} />
        </div>
      )}
    </div>
  );
};
