/**
 * 实现逻辑：
 *
 * 1. 传入 container、menu 元素
 * 2. 监听 container 的 resize，决定能够容纳的元素大小，进行动态的展示 menu 元素,
 */
import { useLayoutEffect, useState, useCallback } from 'react';

interface ResizePanelProps {
  getGroupSelector: () => HTMLElement;
  getResizeSelector: () => NodeListOf<HTMLElement>;
  paddingSize: number;
  initialContainCnt: number;
  placeholderWidth: number;
}

export const useResizeBox = (props: ResizePanelProps): [number, () => void] => {
  const { getGroupSelector, getResizeSelector, paddingSize = 0, initialContainCnt, placeholderWidth } = props;

  const [containCnt, setContainCnt] = useState(initialContainCnt);

  const updateContainCnt = useCallback(() => {
    const panelGroup = getGroupSelector();
    if (!panelGroup) return;

    let resizeHandles = getResizeSelector();
    if (resizeHandles.length === 0) return;

    let availableWidth = panelGroup.offsetWidth - placeholderWidth - 2 * paddingSize;
    let totalWidth = 0;
    let canContainIndex = 0;

    for (let i = 0; i < resizeHandles.length; i++) {
      const itemWidth = resizeHandles[i].offsetWidth;
      if (totalWidth + itemWidth > availableWidth) break;
      totalWidth += itemWidth;
      canContainIndex++;
    }

    setContainCnt(canContainIndex);
  }, [getGroupSelector, getResizeSelector, placeholderWidth, paddingSize]);

  useLayoutEffect(() => {
    const panelGroup = getGroupSelector();
    if (!panelGroup) return;

    const observer = new ResizeObserver(() => {
      updateContainCnt();
    });

    observer.observe(panelGroup);

    return () => {
      observer.disconnect();
    };
  }, [updateContainCnt]);

  return [containCnt, updateContainCnt];
};
