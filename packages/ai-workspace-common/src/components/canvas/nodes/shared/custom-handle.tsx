import { Handle, Position, HandleType } from '@xyflow/react';
import React, { CSSProperties } from 'react';

interface CustomHandleProps {
  id: string;
  type: HandleType;
  position: Position;
  isConnected: boolean;
  isNodeHovered: boolean;
  nodeType: string;
}

export const CustomHandle = React.memo(
  ({ id, type, position, isConnected, isNodeHovered }: CustomHandleProps) => {
    const baseHandleStyle: CSSProperties = {
      width: '14px',
      height: '14px',
      background: '#fff',
      border: `2px solid ${isNodeHovered ? '#00968F' : '#D0D5DD'}`,
      minWidth: '14px',
      minHeight: '14px',
      borderRadius: '50%',
      opacity: isNodeHovered ? 1 : isConnected ? 0.8 : 0.4,
      cursor: 'crosshair',
      position: 'absolute' as const,
      [position === Position.Left
        ? 'left'
        : position === Position.Right
          ? 'right'
          : position === Position.Top
            ? 'top'
            : 'bottom']: '-6px',
      transform:
        position === Position.Left || position === Position.Right
          ? 'translateY(-50%)'
          : 'translateX(-50%)',
      zIndex: 5,
      transition: 'all 0.2s ease',
    };

    return (
      <div
        className={`
        absolute ${position === Position.Left ? 'left-0' : position === Position.Right ? 'right-0' : ''}
        ${position === Position.Top ? 'top-0' : position === Position.Bottom ? 'bottom-0' : ''}
        ${position === Position.Left || position === Position.Right ? 'h-full' : 'w-full'}
        flex ${position === Position.Left || position === Position.Right ? 'items-center' : 'justify-center'}
        pointer-events-none
      `}
      >
        <Handle
          id={id}
          type={type}
          position={position}
          style={baseHandleStyle}
          isConnectable={true}
          className="pointer-events-auto hover:opacity-100 hover:border-[#00968F] hover:scale-110 transition-all"
        />
      </div>
    );
  },
);

CustomHandle.displayName = 'CustomHandle';
