export const calcPopupPosition = (rect: DOMRect, barDimesion: { barWidth: number; barHeight: number }) => {
  const { barHeight, barWidth } = barDimesion;
  let top = 0;
  let left = 0;

  const viewportWidth = window?.visualViewport?.width || 0;
  const viewportHeight = window?.visualViewport?.height || 0;

  if (rect.width <= barWidth) {
    left = rect.left - (barWidth - rect.width) / 2;
  } else if (rect.width > barWidth) {
    left = rect.left + (rect.width - barWidth) / 2;
  }

  if (left < 0) left = 0;
  if (left + barWidth > viewportWidth) left = viewportHeight - barWidth;

  if (rect.bottom + barHeight > viewportHeight) {
    top = rect.top - 12;
  } else if (rect.bottom + barHeight <= viewportHeight) {
    top = rect.bottom + 12;
  }

  return { top, left };
};

export const scrollToBottom = () => {
  setTimeout(() => {
    const chatWrapperElem = document.querySelector('plasmo-csui')?.shadowRoot?.querySelector('.chat-wrapper');

    if (chatWrapperElem) {
      const { scrollHeight, clientHeight } = chatWrapperElem;
      chatWrapperElem.scrollTop = scrollHeight - clientHeight;
    }
  });
};

export function getCSSVar(varName: string) {
  return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

export function isMobileScreen() {
  return window.innerWidth <= 600;
}

export const handleChatWindowTriggered = (isShowSide) => {
  const html = document.querySelector('html') as HTMLHtmlElement;
  html.style.position = 'relative';
  html.style.minHeight = '100vh';
  if (isShowSide) {
    const { clientWidth = 0 } = document.querySelector('plasmo-csui')?.shadowRoot?.querySelector('.main') || {};
    html.style.width = `calc(100vw - ${clientWidth}px)`;
  } else {
    html.style.width = '100vw';
  }
};

// 这里先写死，后续做 Monica 的指令模版时再动态计算
const barWidth = 217;
const barHeight = 30;
export const getBarPosition = (lastMouseEvent, event, selection: Selection) => {
  let top = 0;
  let left = 0;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    // 选中 Input/Textarea 区域
    top = event.pageY + 8 > (window?.visualViewport?.height || 0) ? event.pageY - 38 : event.pageY + 8;
    left =
      (event.pageX + lastMouseEvent.pageX) / 2 > (window?.visualViewport?.width || 0)
        ? (window?.visualViewport?.width || 0) - barWidth
        : (event.pageX + lastMouseEvent.pageX) / 2;
  } else {
    // 非 Input/Textarea 区域
    ({ top, left } = calcPopupPosition(rect, { barWidth, barHeight }));
  }

  return { top, left };
};
