import React from 'react';
import Moveable from 'react-moveable';
import classNames from 'classnames';

interface NodeResizerProps {
  targetRef: React.RefObject<HTMLElement>;
  isSelected: boolean;
  isHovered: boolean;
  isPreview?: boolean;
  sizeMode?: 'compact' | 'adaptive';
  onResize: (params: any) => void;
}

export const NodeResizer: React.FC<NodeResizerProps> = ({
  targetRef,
  isSelected,
  isHovered,
  isPreview = false,
  sizeMode = 'adaptive',
  onResize,
}) => {
  if (isPreview || !isSelected || sizeMode !== 'adaptive') {
    return null;
  }

  return (
    <Moveable
      target={targetRef}
      resizable={true}
      edge={false}
      throttleResize={1}
      renderDirections={['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']}
      onResizeStart={({ setOrigin, dragStart }) => {
        setOrigin(['%', '%']);
        if (dragStart && dragStart instanceof MouseEvent) {
          dragStart.preventDefault();
        }
      }}
      onResize={onResize}
      hideDefaultLines={true}
      className={`!pointer-events-auto ${!isHovered ? 'moveable-control-hidden' : 'moveable-control-show'}`}
    />
  );
};
