import React, { type ReactNode, forwardRef, useRef } from 'react';
import Tippy from '@tippyjs/react';
import type { TippyProps } from '@tippyjs/react';
import { useSelectionBubble } from '../../hooks/use-selection-bubble';
import { GetReferenceClientRect } from 'tippy.js';

interface SelectionBubbleProps {
  containerClass: string;
  children: ReactNode;
  onSelect?: (selectedText: string) => void;
  enabled?: boolean;
  placement?: TippyProps['placement'];
  offset?: [number, number];
}

export const SelectionBubble: React.FC<SelectionBubbleProps> = ({
  containerClass,
  children,
  onSelect,
  enabled = true,
  placement = 'top',
  offset = [0, 10],
}) => {
  const { isVisible, selectedText, bubbleRef, containerRef, closeBubble } = useSelectionBubble({
    containerClass,
    onSelect,
    enabled,
  });

  // Cache the selection rect
  const selectionRectRef = useRef<DOMRect | null>(null);

  const getReferenceClientRect = () => {
    // Return cached rect if available
    if (selectionRectRef.current) {
      return selectionRectRef.current;
    }

    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Cache the rect
    selectionRectRef.current = rect;

    return {
      width: rect?.width,
      height: rect?.height,
      top: rect?.top,
      left: rect?.left,
      right: rect?.right,
      bottom: rect?.bottom,
      x: rect?.left,
      y: rect?.top,
    };
  };

  // Wrap children with closeBubble functionality
  const wrappedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onClick: async (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          // Call onSelect with the selected text
          if (onSelect && selectedText) {
            onSelect(selectedText);
          }

          // Call the original onClick if it exists
          if (child.props.onClick) {
            await child.props.onClick(e);
          }

          // Clear the cached rect
          selectionRectRef.current = null;
          closeBubble();
        },
      });
    }
    return child;
  });

  return (
    <div ref={containerRef} className="selection-bubble-container">
      {isVisible && (
        <Tippy
          ref={bubbleRef}
          content={wrappedChildren}
          visible={true}
          interactive
          animation="scale-subtle"
          placement={placement}
          offset={offset}
          getReferenceClientRect={getReferenceClientRect as GetReferenceClientRect}
          appendTo="parent"
          className="selection-bubble-menu"
          zIndex={5}
        >
          <div className="selection-bubble-anchor" />
        </Tippy>
      )}
    </div>
  );
};
