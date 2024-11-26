import { useEffect } from 'react';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Canvas } from '@refly/openapi-schema';
import { IconCanvas, IconPlay } from '@refly-packages/ai-workspace-common/components/common/icon';
import { List, Modal, Button } from 'antd';
import { ScrollLoading } from '../scroll-loading';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { LOCALE } from '@refly/common-types';
import './index.scss';

interface CanvasListProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const CanvasListModal = (props: CanvasListProps) => {
  const { visible, setVisible } = props;
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const navigate = useNavigate();
  const { dataList, setDataList, loadMore, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listCanvases({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 20,
  });

  useEffect(() => {
    if (visible) {
      loadMore();
    }
  }, [visible]);

  const handleClickCanvas = (canvas: Canvas) => {
    setVisible(false);
    navigate(`/canvas/${canvas.canvasId}`);
  };

  const handleDeleteCanvas = (canvas: Canvas) => {
    setDataList(dataList.filter((n) => n.canvasId !== canvas.canvasId));
  };

  const CanvasItem = (props: { canvas: Canvas }) => {
    const { canvas } = props;
    return (
      <div className="px-4 py-3 min-w-[600px] flex items-center justify-between border-b border-solid border-1 border-x-0 border-t-0 border-black/5">
        <div>
          <div className="flex items-center gap-2">
            <IconCanvas style={{ fontSize: 20 }} />
            <div className="font-medium">{canvas.title}</div>
          </div>

          <div className="mt-1 ml-7">
            <div className="text-xs text-black/40">
              {time(canvas.updatedAt, language as LOCALE)
                .utc()
                .fromNow()}
            </div>
          </div>
        </div>

        <div className="flex">
          <Button
            style={{ borderRadius: 8, cursor: 'pointer' }}
            size="small"
            color="default"
            variant="filled"
            icon={<IconPlay />}
            onClick={() => handleClickCanvas(canvas)}
          >
            <span className="text-xs font-medium">{t('workspace.canvasListModal.continue')}</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      className="canvas-list"
      centered
      title={t('common.canvas')}
      width={900}
      footer={null}
      open={visible}
      onCancel={() => setVisible(false)}
    >
      <List
        itemLayout="vertical"
        dataSource={dataList}
        locale={{ emptyText: t('common.empty') }}
        loadMore={
          dataList.length > 0 ? (
            <ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />
          ) : null
        }
        renderItem={(item: Canvas) => <CanvasItem canvas={item} />}
      ></List>
    </Modal>
  );
};
