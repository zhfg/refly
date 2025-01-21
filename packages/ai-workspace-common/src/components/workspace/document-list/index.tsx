import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { List, Card, Dropdown, Button, Popconfirm, message, Empty, Tooltip } from 'antd';
import type { MenuProps, DropdownProps } from 'antd';

import { IconMoreHorizontal, IconEdit, IconDelete } from '@refly-packages/ai-workspace-common/components/common/icon';

import { useEffect, useState } from 'react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import type { Document } from '@refly/openapi-schema';
import { LOCALE } from '@refly/common-types';
import { useTranslation } from 'react-i18next';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useDeleteDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-document';

const { Meta } = Card;

const ActionDropdown = ({ doc, afterDelete }: { doc: Document; afterDelete: () => void }) => {
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const { deleteDocument } = useDeleteDocument();

  const handleDelete = async () => {
    const success = await deleteDocument(doc.docId);
    if (success) {
      message.success(t('common.putSuccess'));
      setPopupVisible(false);
      afterDelete?.();
    }
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <Popconfirm
          title={t('canvas.nodeActions.deleteFileConfirm', {
            type: t(`common.document`),
            title: doc.title || t('common.unTitle'),
          })}
          onConfirm={handleDelete}
          onCancel={() => setPopupVisible(false)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          overlayStyle={{ maxWidth: '300px' }}
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

export const DocumentList = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const { addNode } = useAddNode();

  const { showLibraryModal, setShowLibraryModal } = useSiderStoreShallow((state) => ({
    showLibraryModal: state.showLibraryModal,
    setShowLibraryModal: state.setShowLibraryModal,
  }));
  const { dataList, setDataList, loadMore, reload, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listDocuments({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  const handleEdit = (doc: Document) => {
    addNode({
      type: 'document',
      data: {
        title: doc.title,
        entityId: doc.docId,
        contentPreview: doc.contentPreview,
      },
    });
    setShowLibraryModal(false);
  };

  const ActionEdit = ({ doc }: { doc: Document }) => {
    return (
      <Tooltip title={t('workspace.addToCanvas')}>
        <Button type="text" icon={<IconEdit />} onClick={() => handleEdit(doc)} />
      </Tooltip>
    );
  };

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
                actions={[
                  <ActionEdit key="edit" doc={item} />,
                  <ActionDropdown
                    doc={item}
                    key="ellipsis"
                    afterDelete={() => setDataList(dataList.filter((n) => n.docId !== item.docId))}
                  />,
                ]}
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
