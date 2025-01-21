import React, { FC, ReactNode, useState } from 'react';
import { Popover } from 'antd';
import type { TooltipPlacement } from 'antd/es/tooltip';
import { Spin } from '../common/spin';
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
  const [isLoading, setIsLoading] = useState(true);

  const renderContent = () => (
    <div className="w-[325px] bg-white rounded-lg overflow-hidden">
      {videoUrl && (
        <div key={videoUrl} className="p-3 pb-2 overflow-hidden relative" style={{ height: '216px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-50 rounded-lg">
              <Spin className="w-6 h-6" />
              <div className="text-gray-600 text-sm mt-2">Loading...</div>
            </div>
          )}
          <iframe
            width="100%"
            height="100%"
            src={videoUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full h-full rounded-lg bg-black"
            style={{
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
            }}
            onLoad={() => {
              setTimeout(() => setIsLoading(false), 500);
            }}
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
      mouseEnterDelay={0.5}
      mouseLeaveDelay={0.5}
      overlayStyle={overlayStyle}
      align={align}
    >
      {children}
    </Popover>
  );
};
