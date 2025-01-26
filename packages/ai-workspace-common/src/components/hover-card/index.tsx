import React, { FC, ReactNode } from "react";
import { Popover } from "antd";
import type { TooltipPlacement } from "antd/es/tooltip";
import { useVideo } from "../../hooks/use-video";
import { useCanvasStoreShallow } from "../../stores/canvas";
import "./index.scss";

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
  placement = "right",
  onOpenChange,
  overlayStyle = { marginLeft: "8px", marginTop: "8px" },
  align = { offset: [8, 8] },
}) => {
  const { videoRef, handlePlay } = useVideo();
  const hoverCardEnabled = useCanvasStoreShallow(
    (state) => state.hoverCardEnabled
  );

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
          >
            <track kind="captions" label="English captions" src="" default />
          </video>
        </div>
      )}
      <div className="px-4 py-3">
        <h3 className="m-0 mb-2 text-base font-medium text-gray-800 leading-[1.4]">
          {title}
        </h3>
        <p className="m-0 text-sm text-gray-500 leading-[1.5]">{description}</p>
      </div>
    </div>
  );

  if (!hoverCardEnabled) {
    return children;
  }

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
