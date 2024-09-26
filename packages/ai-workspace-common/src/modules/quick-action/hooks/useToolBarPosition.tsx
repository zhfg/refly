import React, { type Dispatch, useEffect, useRef, useState } from 'react';

import { useQuickActionStore } from '../stores/quick-action';
import { getBarPosition } from '../utils/ui';

type BarPosition = {
  top?: number;
  left?: number;
};

export const useBarPosition = (): BarPosition => {
  const uiStore = useQuickActionStore();

  const lastMouseEventRef = useRef<MouseEvent | null>();
  const [barPosition, setBarPosition] = useState<BarPosition>({});

  const handleMouseUp = (event: MouseEvent) => {
    // 点击的是 Toolbar 上的按钮，返回
    if ((event.target as any).nodeName === 'PLASMO-CSUI') {
      // event.preventDefault()
      // event.stopPropagation()
      return;
    }

    window.setTimeout(() => {
      const selection = window.getSelection() as Selection;
      const text = selection.toString();

      if (text && text?.trim()?.length > 0) {
        const { top, left } = getBarPosition(lastMouseEventRef.current, event, selection);

        setBarPosition(() => ({ top, left }));
        uiStore.updateUIState({
          selectedText: text,
          quickActionToolbarVisible: true,
        });
      } else {
        uiStore.updateUIState({
          selectedText: '',
          quickActionToolbarVisible: false,
          popupVisible: false,
        });
      }
    });
  };

  const handleMouseDown = (event: MouseEvent) => {
    lastMouseEventRef.current = event;

    const selection = window.getSelection() as Selection;
    const text = selection.toString();

    // 点击的是 Toolbar => 显示
    if ((event.target as any).nodeName === 'PLASMO-CSUI') {
      // event.preventDefault()
      // event.stopPropagation()
      return;
    }
  };

  const bindMouseEvent = () => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);
  };

  useEffect(() => {
    bindMouseEvent();

    return () => {
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, {
        capture: true,
      });
    };
  }, []);

  return barPosition;
};
