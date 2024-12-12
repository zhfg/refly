import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Space, Divider, Tooltip } from 'antd';
import { MdOutlineMouse } from 'react-icons/md';
import { LuTouchpad } from 'react-icons/lu';
import { LuLayoutDashboard } from 'react-icons/lu';
import { RiFullscreenFill } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { LuZoomIn, LuZoomOut } from 'react-icons/lu';
import { IconDown } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useReactFlow } from '@xyflow/react';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

interface LayoutControlProps {
  mode: 'mouse' | 'touchpad';
  changeMode: (mode: 'mouse' | 'touchpad') => void;
}

const iconClass = 'flex items-center justify-center';
const buttonClass = '!p-0 h-[30px] w-[30px] flex items-center justify-center ';

export const LayoutControl: React.FC<LayoutControlProps> = ({ mode, changeMode }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { onLayout } = useCanvasControl();
  const reactFlowInstance = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(reactFlowInstance?.getZoom() ?? 1);
  const minZoom = 0.5;
  const maxZoom = 2;

  useEffect(() => {
    const updateZoom = () => {
      setCurrentZoom(reactFlowInstance?.getZoom() ?? 1);
    };

    let animationFrameId: number;
    // Store the animation frame ID
    const handleZoom = () => {
      updateZoom();
      animationFrameId = requestAnimationFrame(handleZoom);
    };

    handleZoom();

    return () => {
      // Clean up using the stored ID
      cancelAnimationFrame(animationFrameId);
    };
  }, [reactFlowInstance]);

  const canZoomIn = currentZoom < maxZoom;
  const canZoomOut = currentZoom > minZoom;

  const handleZoomIn = () => {
    if (canZoomIn) {
      reactFlowInstance?.zoomIn?.();
    }
  };

  const handleZoomOut = () => {
    if (canZoomOut) {
      reactFlowInstance?.zoomOut?.();
    }
  };

  const items = [
    {
      key: 'mouse',
      label: (
        <Space>
          <MdOutlineMouse className={iconClass} />
          {t('canvas.toolbar.mouse')}
        </Space>
      ),
    },
    {
      key: 'touchpad',
      label: (
        <Space>
          <LuTouchpad className={iconClass} />
          {t('canvas.toolbar.touchpad')}
        </Space>
      ),
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    changeMode(key as 'mouse' | 'touchpad');
  };

  const buttons = [
    {
      key: 'zoomIn',
      children: <LuZoomIn className={iconClass} size={16} />,
      onClick: handleZoomIn,
      disabled: !canZoomIn,
      className: `${buttonClass} ${!canZoomIn ? 'opacity-50 cursor-not-allowed' : ''}`,
    },

    {
      key: 'zoom',
      children: <div className="text-xs">{Math.round(currentZoom * 100)}%</div>,
      className: `${buttonClass} pointer-events-none mx-1.5`,
    },
    {
      key: 'zoomOut',
      children: <LuZoomOut className={iconClass} size={16} />,
      onClick: handleZoomOut,
      disabled: !canZoomOut,
      className: `${buttonClass} ${!canZoomOut ? 'opacity-50 cursor-not-allowed' : ''}`,
    },
    {
      key: 'fitView',
      children: <RiFullscreenFill className={iconClass} size={16} />,
      onClick: () => reactFlowInstance?.fitView(),
      className: `${buttonClass}`,
    },
    {
      key: 'layout',
      children: <LuLayoutDashboard className={iconClass} size={16} />,
      onClick: () => onLayout('LR'),
      className: `${buttonClass}`,
    },
  ];

  return (
    <div className="absolute bottom-2 left-2.5 px-1 h-[32px] border-box flex items-center justify-center bg-white rounded-md shadow-md">
      {buttons.map((button) => (
        <React.Fragment key={button.key}>
          <Tooltip title={t(`canvas.toolbar.tooltip.${button.key}`)} arrow={false}>
            <Button type="text" className={button.className} onClick={button.onClick} disabled={button.disabled}>
              {button.children}
            </Button>
          </Tooltip>
          {button.key === 'zoomOut' && <Divider type="vertical" className="h-full" />}
        </React.Fragment>
      ))}

      <Dropdown
        menu={{
          items,
          onClick: handleMenuClick,
          selectedKeys: [mode],
        }}
        trigger={['click']}
        open={open}
        onOpenChange={setOpen}
      >
        <Tooltip title={t('canvas.toolbar.tooltip.mode')} arrow={false}>
          <Button
            type="text"
            className="!p-0 h-[30px] w-[48px] flex items-center justify-center 
                  hover:bg-gray-100 
                  transition-colors duration-200 
                  group"
          >
            {mode === 'mouse' ? <MdOutlineMouse className={iconClass} /> : <LuTouchpad className={iconClass} />}
            <IconDown className={`ml-[-6px] ${iconClass} ${open ? 'rotate-180' : ''}`} />
          </Button>
        </Tooltip>
      </Dropdown>
    </div>
  );
};
