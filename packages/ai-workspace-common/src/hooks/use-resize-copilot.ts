import { useLayoutEffect } from 'react';

interface ResizePanelProps {
  containerSelector: string;
}

export const useResizeCopilot = (props: ResizePanelProps) => {
  const { containerSelector } = props;

  useLayoutEffect(() => {
    const panelGroup = document.querySelector(`.${containerSelector}`) as HTMLElement;
    if (!(panelGroup instanceof Element)) return;

    const observer = new ResizeObserver(() => {
      const width = panelGroup.offsetWidth;
      console.log('width', width);

      if (width < 400) {
        panelGroup.classList.remove('media-query-max-width-800');
        panelGroup.classList.remove('media-query-min-width-800');
        panelGroup.classList.add('media-query-max-width-400');
      } else if (width >= 400 && width <= 800) {
        panelGroup.classList.remove('media-query-max-width-400');
        panelGroup.classList.remove('media-query-min-width-800');
        panelGroup.classList.add('media-query-max-width-800');
      } else {
        panelGroup.classList.remove('media-query-max-width-800');
        panelGroup.classList.remove('media-query-max-width-400');
        panelGroup.classList.add('media-query-min-width-800');
      }
    });
    observer.observe(panelGroup);

    return () => {
      observer.unobserve(panelGroup);
      observer.disconnect();
    };
  }, []);
};
