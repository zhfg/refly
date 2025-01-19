import React, { FC, ReactNode, useRef, useEffect, useCallback } from 'react';
import { Popover } from 'antd';
import type { TooltipPlacement } from 'antd/es/tooltip';
import './index.scss';

export interface HoverContent {
  title: string;
  description: string;
  videoUrl?: string;
  placement?: TooltipPlacement;
  overlayStyle?: React.CSSProperties;
  align?: { offset: [number, number] };
}

export interface HoverCardProps {
  children: ReactNode;
  title: string;
  description: string;
  videoUrl?: string;
  placement?: TooltipPlacement;
  onOpenChange?: (open: boolean) => void;
  overlayStyle?: React.CSSProperties;
  align?: { offset: [number, number] };
}

export const HoverCard: FC<HoverCardProps> = ({
  children,
  title,
  description,
  videoUrl,
  placement = 'right',
  onOpenChange,
  overlayStyle = { marginLeft: '8px', marginTop: '8px' },
  align = { offset: [8, 8] },
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      // 尝试取消静音并设置音量
      video.muted = false;
      video.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // 添加事件监听器
      video.addEventListener('play', handlePlay);
      // 初始化音量
      video.volume = 0.5;
    }

    return () => {
      // 清理事件监听器
      if (video) {
        video.removeEventListener('play', handlePlay);
      }
    };
  }, [handlePlay]);

  const renderContent = () => (
    <div className="w-[325px] bg-white rounded-lg overflow-hidden">
      {videoUrl && (
        <div className="p-3 pb-2 overflow-hidden">
          <video
            ref={videoRef}
            width="325"
            height="216"
            src={videoUrl}
            controls
            controlsList="nodownload"
            loop
            playsInline
            onPlay={handlePlay}
            className="w-full h-[216px] object-cover rounded-lg bg-black"
          />
        </div>
      )}
      <div className="px-4 py-3">
        <h3 className="m-0 mb-2 text-base font-medium text-gray-800 leading-[1.4]">{title}</h3>
        <p className="m-0 text-sm text-gray-500 leading-[1.5]">{description}</p>
      </div>
    </div>
  );

  return (
    <Popover
      content={renderContent()}
      placement={placement}
      trigger="hover"
      onOpenChange={onOpenChange}
      overlayClassName="hover-card-popover"
      mouseEnterDelay={0.2}
      mouseLeaveDelay={0.3}
      overlayStyle={overlayStyle}
      align={align}
    >
      {children}
    </Popover>
  );
};
