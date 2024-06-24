/**
 * 实现逻辑：
 *
 * 1. 传入 container、menu 元素
 * 2. 监听 container 的 resize，决定能够容纳的元素大小，进行动态的展示 menu 元素,
 */
import { useLayoutEffect, useState } from 'react';

interface ResizePanelProps {
  getGroupSelector: () => HTMLElement;
  getResizeSelector: () => NodeListOf<HTMLElement>;
  paddingSize: number;
  initialContainCnt: number;
  placeholderWidth: number;
}

export const useResizeBox = (props: ResizePanelProps) => {
  const { getGroupSelector, getResizeSelector, paddingSize = 0, initialContainCnt, placeholderWidth } = props;
  const [containCnt, setContainCnt] = useState(initialContainCnt);

  useLayoutEffect(() => {
    const panelGroup = getGroupSelector();
    const resizeHandles = getResizeSelector();
    if (!(panelGroup instanceof Element)) return;

    const observer = new ResizeObserver(() => {
      let width = panelGroup.offsetWidth;
      console.log('resizeBox width', width);

      let canContainIndex = 0;
      width -= placeholderWidth;
      width -= 2 * paddingSize;
      resizeHandles.forEach((resizeHandle) => {
        const itemWidth = resizeHandle.getBoundingClientRect()?.width || 0;
        console.log('resizeHandle width', itemWidth);
        if (width > itemWidth && itemWidth !== 0) {
          canContainIndex++;
          width -= itemWidth;
        }
      });

      setContainCnt(canContainIndex);
    });
    observer.observe(panelGroup);
    resizeHandles.forEach((resizeHandle) => {
      if (!(resizeHandle instanceof Element)) return;
      observer.observe(resizeHandle);
    });

    return () => {
      observer.unobserve(panelGroup);
      resizeHandles.forEach((resizeHandle) => {
        observer.unobserve(resizeHandle);
      });
      observer.disconnect();
    };
  }, []);

  return [containCnt];
};
