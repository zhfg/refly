import { useEffect, useState } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Canvas } from '@refly/openapi-schema';
import {
  IconCanvas,
  IconDelete,
  IconMoreHorizontal,
  IconPlay,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { List, Modal, Button, Dropdown, DropdownProps, MenuProps, Popconfirm, message, Empty } from 'antd';
import { ScrollLoading } from '../scroll-loading';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { LOCALE } from '@refly/common-types';
import './index.scss';
import { useDeleteCanvas } from '@refly-packages/ai-workspace-common/hooks/use-delete-canvas';
interface CanvasListProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const CanvasListModal = (props: CanvasListProps) => {
  const { visible, setVisible } = props;
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const navigate = useNavigate();
  const { dataList, setDataList, loadMore, reload, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listCanvases({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });
  const { deleteCanvas } = useDeleteCanvas();

  useEffect(() => {
    if (visible) {
      reload();
    }
  }, [visible]);

  const handleClickCanvas = (canvas: Canvas) => {
    setVisible(false);
    navigate(`/canvas/${canvas.canvasId}`);
  };

  const CanvasItem = (props: { canvas: Canvas }) => {
    const { canvas } = props;

    const ActionDropdown = () => {
      const [popupVisible, setPopupVisible] = useState(false);

      const handleDelete = async () => {
        const success = await deleteCanvas(canvas.canvasId);
        if (success) {
          setDataList(dataList.filter((n) => n.canvasId !== canvas.canvasId));
        }
      };

      const items: MenuProps['items'] = [
        {
          label: (
            <Popconfirm
              title={t('workspace.deleteDropdownMenu.deleteConfirmForCanvas')}
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
          <Button size="small" type="text" icon={<IconMoreHorizontal />} />
        </Dropdown>
      );
    };

    return (
      <div className="px-4 py-3 min-w-[600px] flex items-center justify-between border-b border-solid border-1 border-x-0 border-t-0 border-black/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium">{canvas.title}</div>
          </div>

          <div className="mt-1">
            <div className="text-xs text-black/40">
              {time(canvas.updatedAt, language as LOCALE)
                .utc()
                .fromNow()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            style={{ borderRadius: 8, cursor: 'pointer' }}
            size="small"
            color="default"
            variant="filled"
            icon={<IconPlay />}
            onClick={() => handleClickCanvas(canvas)}
          >
            <span className="text-xs hover:font-medium">{t('workspace.canvasListModal.continue')}</span>
          </Button>
          <ActionDropdown />
        </div>
      </div>
    );
  };

  return (
    <Modal
      className="canvas-list"
      centered
      title={
        <span className="flex items-center gap-2 text-lg font-medium">
          <IconCanvas /> {t('common.canvas')}
        </span>
      }
      width={1000}
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
      focusTriggerAfterClose={false}
    >
      {isRequesting || dataList.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={dataList}
          locale={{ emptyText: t('common.empty') }}
          loading={isRequesting}
          loadMore={
            dataList.length > 0 ? (
              <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
            ) : null
          }
          renderItem={(item: Canvas) => <CanvasItem canvas={item} />}
        ></List>
      ) : (
        <div className="h-full flex items-center justify-center">
          <Empty description={t('common.empty')} />
        </div>
      )}
    </Modal>
  );
};
