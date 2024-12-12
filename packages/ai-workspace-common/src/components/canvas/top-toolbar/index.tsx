import React, { useEffect, useRef } from 'react';
import {
  Button,
  Divider,
  Tooltip,
  Avatar,
  Dropdown,
  MenuProps,
  Popconfirm,
  DropdownProps,
  Input,
  Modal,
  Skeleton,
  message,
} from 'antd';
import { useSiderStore, useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useTranslation } from 'react-i18next';
import { FC, useState } from 'react';

import { MdOutlineHideImage, MdOutlineAspectRatio } from 'react-icons/md';
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import {
  IconCanvas,
  IconEdit,
  IconDelete,
  IconMoreHorizontal,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import SiderPopover from '../../../../../../apps/web/src/pages/sider-popover';
import Logo from '../../../../../../apps/web/src/assets/logo.svg';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useUpdateCanvas } from '@refly-packages/ai-workspace-common/queries/queries';
import { Helmet } from 'react-helmet';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { useNavigate } from 'react-router-dom';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

interface TopToolbarProps {
  canvasId: string;
}

export const TopToolbar: FC<TopToolbarProps> = ({ canvasId }) => {
  const { t } = useTranslation();
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));

  const { data, showPreview, setShowPreview, showMaxRatio, setShowMaxRatio, showLaunchpad, setShowLaunchpad } =
    useCanvasStoreShallow((state) => ({
      data: state.data,
      showPreview: state.showPreview,
      setShowPreview: state.setShowPreview,
      showMaxRatio: state.showMaxRatio,
      setShowMaxRatio: state.setShowMaxRatio,
      showLaunchpad: state.showLaunchpad,
      setShowLaunchpad: state.setShowLaunchpad,
    }));
  const canvasTitle = data[canvasId]?.title;
  const { setCanvasTitle } = useCanvasControl();

  const [editedTitle, setEditedTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputRef = useRef(null);

  const handleEditClick = () => {
    setEditedTitle(data[canvasId]?.title ?? '');
    setIsModalOpen(true);
  };

  const { mutate, status } = useUpdateCanvas();
  const setCanvasList = useSiderStoreShallow((state) => state.setCanvasList);

  useEffect(() => {
    if (canvasTitle && typeof canvasTitle === 'string') {
      const { canvasList } = useSiderStore.getState();
      const currentCanvas = canvasList.find((canvas) => canvas.id === canvasId);
      if (currentCanvas && currentCanvas.name !== canvasTitle) {
        setCanvasList(canvasList.map((canvas) => (canvas.id === canvasId ? { ...canvas, name: canvasTitle } : canvas)));
      }
    }
  }, [canvasId, canvasTitle]);

  const handleModalOk = () => {
    if (editedTitle?.trim()) {
      setCanvasTitle(editedTitle);
      mutate({ body: { canvasId, title: editedTitle } }, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const ActionDropdown = () => {
    const [popupVisible, setPopupVisible] = useState(false);
    const [isRequest, setIsRequest] = useState(false);
    const navigate = useNavigate();
    const { getCanvasList, canvasList } = useHandleSiderData();

    const handleDelete = async () => {
      if (isRequest) return;
      let success = false;
      setIsRequest(true);
      const { data } = await getClient().deleteCanvas({
        body: {
          canvasId,
        },
      });

      setIsRequest(false);

      if (data?.success) {
        success = true;
        message.success(t('canvas.action.deleteSuccess'));

        // Check and remove canvasId from localStorage if matches
        const { currentCanvasId, setCurrentCanvasId } = useCanvasStore.getState();
        if (currentCanvasId === canvasId) {
          setCurrentCanvasId(null);
        }

        await getCanvasList();
        if (currentCanvasId === canvasId) {
          const firstCanvas = canvasList?.find((canvas) => canvas.id !== canvasId);
          if (firstCanvas?.id) {
            navigate(`/canvas/${firstCanvas?.id}`, { replace: true });
          } else {
            navigate('/canvas/empty', { replace: true });
          }
        }
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
        destroyPopupOnHide
        menu={{
          items,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center h-9 bg-[#ffffff] rounded-lg px-2 border border-solid border-1 border-[#EAECF0] box-shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)]">
            <Button type="text" icon={<IconMoreHorizontal />} className="w-8 h-6 flex items-center justify-center" />
          </div>
        </div>
      </Dropdown>
    );
  };

  return (
    <>
      <Helmet>
        <title>{canvasTitle?.toString() || t('common.untitled')} · Refly</title>
      </Helmet>
      <div
        className={`absolute h-16 top-0 left-0 right-0  box-border flex justify-between items-center py-2 px-4 pr-0 z-10 bg-transparent ${
          collapse ? 'w-[calc(100vw-12px)]' : 'w-[calc(100vw-232px)]'
        }`}
      >
        <div className="flex items-center">
          {collapse ? (
            <>
              <SiderPopover>
                <Button
                  type="text"
                  icon={<AiOutlineMenuUnfold size={20} />}
                  onClick={() => {
                    setCollapse(!collapse);
                  }}
                />
              </SiderPopover>
              <Divider type="vertical" className="pr-[4px]" />
              <div className="flex items-center justify-center">
                <Avatar size={32} src={Logo} />
                <span className="text-sm font-bold ml-2">Refly</span>
              </div>
            </>
          ) : (
            <Button
              type="text"
              icon={<AiOutlineMenuFold size={20} />}
              onClick={() => {
                setCollapse(!collapse);
              }}
            />
          )}
          <Divider type="vertical" className="pr-[4px]" />
          <div
            className="group flex items-center gap-2 text-sm font-bold text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={handleEditClick}
          >
            <IconCanvas />
            {!data[canvasId] ? (
              <Skeleton className="w-28" active paragraph={false} />
            ) : (
              canvasTitle || t('common.untitled')
            )}
            <IconEdit className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <Modal
            centered
            title={t('canvas.toolbar.editTitle')}
            open={isModalOpen}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            confirmLoading={status === 'pending'}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            okButtonProps={{ disabled: !editedTitle?.trim() }}
            afterOpenChange={(open) => {
              if (open) {
                inputRef.current?.focus();
              }
            }}
          >
            <Input
              autoFocus
              ref={inputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder={t('canvas.toolbar.editTitlePlaceholder')}
              onKeyDown={(e) => {
                if (e.keyCode === 13 && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (editedTitle?.trim()) {
                    handleModalOk();
                  }
                }
              }}
            />
          </Modal>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center h-9 bg-[#ffffff] rounded-lg px-2 border border-solid border-1 border-[#EAECF0] box-shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)]">
            <Tooltip
              title={t(`canvas.toolbar.${showLaunchpad ? 'hideLaunchpad' : 'showLaunchpad'}`)}
              destroyTooltipOnHide
            >
              <Button
                type="text"
                icon={<IconCanvas />}
                className="w-8 h-6 flex items-center justify-center"
                style={{ color: showLaunchpad ? '#000' : '#9CA3AF' }}
                onClick={() => setShowLaunchpad(!showLaunchpad)}
              />
            </Tooltip>
            <Divider type="vertical" />
            <Tooltip title={t(`canvas.toolbar.${showPreview ? 'hidePreview' : 'showPreview'}`)} destroyTooltipOnHide>
              <Button
                type="text"
                icon={<MdOutlineHideImage style={{ color: showPreview ? '#9CA3AF' : '#000' }} />}
                onClick={() => setShowPreview(!showPreview)}
                className="w-8 h-6 flex items-center justify-center mr-1"
              />
            </Tooltip>
            <Tooltip title={t(`canvas.toolbar.${showMaxRatio ? 'hideMaxRatio' : 'showMaxRatio'}`)} destroyTooltipOnHide>
              <Button
                type="text"
                icon={<MdOutlineAspectRatio style={{ color: showMaxRatio ? '#000' : '#9CA3AF' }} />}
                onClick={() => setShowMaxRatio(!showMaxRatio)}
                className="w-8 h-6 flex items-center justify-center"
              />
            </Tooltip>
          </div>

          <ActionDropdown />
        </div>
      </div>
    </>
  );
};
