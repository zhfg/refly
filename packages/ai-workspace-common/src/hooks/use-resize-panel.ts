import { useLayoutEffect, useState } from 'react';

interface ResizePanelProps {
  getGroupSelector: () => HTMLElement;
  getResizeSelector: () => NodeListOf<HTMLElement>;
  initialMinSize: number;
  initialMinPixelSize: number;
}

export const useResizePanel = (props: ResizePanelProps) => {
  const { getGroupSelector, getResizeSelector, initialMinPixelSize, initialMinSize } = props;
  const [minSize, setMinSize] = useState(initialMinSize);

  useLayoutEffect(() => {
    const panelGroup = getGroupSelector();
    const resizeHandles = getResizeSelector();
    if (!(panelGroup instanceof Element)) return;

    const observer = new ResizeObserver(() => {
      let width = panelGroup.offsetWidth;

      resizeHandles.forEach((resizeHandle) => {
        width -= resizeHandle.offsetWidth;
      });

      // console.log('initialMinPixelSize', width);

      setMinSize((initialMinPixelSize / width) * 100);
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

  return [minSize];
};
