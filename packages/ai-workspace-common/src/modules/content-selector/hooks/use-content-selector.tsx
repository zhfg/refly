import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import type { Mark, SyncMarkEvent, SyncStatusEvent } from '@refly/common-types';
import getXPath from 'get-xpath';
import { safeStringifyJSON } from '@refly-packages/utils/parse';
import {
  BackgroundMessage,
  sendMessage,
  onMessage,
} from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { SelectedNamespace } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
// import { getContentFromHtmlSelector } from "@/utils/weblink"

function getElementType(element) {
  // 检查元素是否为 table 元素
  if (element.tagName.toLowerCase() === 'table') {
    return 'table';
  }
  // 检查元素是否为 a 标签(链接)
  else if (element.tagName.toLowerCase() === 'a') {
    return 'link';
  }
  // 检查元素是否为 img 标签(图像)
  else if (element.tagName.toLowerCase() === 'img') {
    return 'image';
  }
  // 检查元素是否为 video 标签
  else if (element.tagName.toLowerCase() === 'video') {
    return 'video';
  }
  // 检查元素是否为 audio 标签
  else if (element.tagName.toLowerCase() === 'audio') {
    return 'audio';
  }
  // 如果以上都不是,则认为是文本元素
  else {
    return 'text';
  }
}

export const useContentSelector = (selector: string | null, namespace: SelectedNamespace) => {
  const statusRef = useRef(true);
  const markRef = useRef<HTMLDivElement>(undefined);
  const targetList = useRef<Element[]>([]);
  const markListRef = useRef<Mark[]>([]);
  const showContentSelectorRef = useRef<boolean>(false);
  const messageListenerEventRef = useRef<any>();

  const buildMark = (target: HTMLElement) => {
    const content = target.innerText;

    const mark: Mark = {
      type: getElementType(target),
      data: content,
      target,
      xPath: getXPath(target),
    };

    // console.log(
    //   "getContentFromHtmlSelector",
    //   getContentFromHtmlSelector(getCSSPath(target)),
    // )

    return mark;
  };

  const addMark = (target: HTMLElement) => {
    const mark = buildMark(target);

    markListRef.current = markListRef.current.concat(mark);
    (target as Element)?.classList.add('refly-content-selected-target');
    // 添加到 list 方便后续统一的处理
    targetList.current = targetList.current.concat(target as Element);

    return mark;
  };

  const removeMark = (target: HTMLElement, xPath: string) => {
    const mark = markListRef.current?.find((item) => item?.xPath === xPath);
    markListRef.current = markListRef.current.filter((item) => item.xPath !== xPath);
    (target as Element)?.classList.remove('refly-content-selected-target');
    targetList.current = targetList.current.filter((item) => item != target);

    return mark;
  };

  const syncMarkEvent = (event: Partial<SyncMarkEvent>) => {
    const { type, mark } = event.body;
    // 发送给 refly-main-app
    const msg: BackgroundMessage = {
      name: 'syncMarkEventFromSelector',
      body: {
        type,
        mark: { type: mark?.type, data: mark?.data, xPath: mark?.xPath },
      },
      source: getRuntime(),
    };
    console.log('contentSelectorClickHandler', safeStringifyJSON(msg));
    sendMessage(msg);
  };

  const resetMarkStyle = () => {
    // mark style
    const mark = markRef.current;

    // TODO: 后续改成 react 组件渲染，带来更多自由度，目前现跑通 PoC
    mark.style.top = '0px';
    mark.style.left = '0px';
    mark.style.width = '0px';
    mark.style.height = '0px';
    mark.style.width = '0px';
    mark.style.height = '0px';
  };

  const resetStyle = () => {
    resetMarkStyle();
    // selected list style
    targetList.current.forEach((item) => item?.classList?.remove('refly-content-selected-target'));
    targetList.current = [];
    markListRef.current = [];
  };

  const contentActionHandler = (ev: MouseEvent) => {
    ev.stopImmediatePropagation();

    console.log('contentActionHandler', ev, statusRef, markRef, showContentSelectorRef);
    if (statusRef.current && markRef.current && showContentSelectorRef.current) {
      const { target } = ev;
      const rect = (target as Element)?.getBoundingClientRect();
      const mark = markRef.current;

      const width = rect.width || 0;
      const height = rect.height || 0;
      const top = rect.top || 0;
      const left = rect.left || 0;
      // console.log('rect', , rect.height, rect.top, rect.left);

      // console.log('top', window.scrollY + rect.top);
      mark.style.top = window.scrollY + top + 'px';
      mark.style.left = window.scrollX + left + 'px';
      mark.style.width = width + 'px';
      mark.style.height = height + 'px';
      mark.style.background = `#00968F26 !important`;
      mark.style.zIndex = '99999999';
    }
  };

  const contentSelectorClickHandler = (ev: MouseEvent) => {
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.stopPropagation();
    let markEvent: { type: 'remove' | 'add'; mark: Mark };

    if (statusRef.current && markRef.current && showContentSelectorRef.current) {
      const { target } = ev;

      if ((target as Element)?.classList.contains('refly-content-selected-target')) {
        const mark = removeMark(target as HTMLElement, getXPath(target));
        markEvent = { type: 'remove', mark };
      } else {
        const mark = addMark(target as HTMLElement);
        markEvent = { type: 'add', mark };
      }

      console.log('markListRef.current', markListRef.current);

      // 发送给 refly-main-app
      const msg: Partial<SyncMarkEvent> = {
        body: markEvent,
      };
      console.log('contentSelectorClickHandler', safeStringifyJSON(msg));
      syncMarkEvent(msg);
    }
  };

  const initDomEventListener = () => {
    const containerElem = selector ? document.querySelector(`.${selector}`) : document.body;

    containerElem.addEventListener('mousemove', contentActionHandler);
    containerElem.addEventListener('click', contentSelectorClickHandler, {
      capture: true,
    });
  };

  const removeDomEventListener = () => {
    const containerElem = selector ? document.querySelector(`.${selector}`) : document.body;

    containerElem.removeEventListener('mousemove', contentActionHandler);
    containerElem.removeEventListener('click', contentSelectorClickHandler, { capture: true });
  };

  const contentSelectorStatusHandler = (event: MessageEvent<any>) => {
    const data = event as any as BackgroundMessage;
    console.log('contentSelectorStatusHandler data', event, getRuntime());
    if ((data as SyncStatusEvent)?.name === 'syncStatusEvent') {
      const { type } = (data as SyncStatusEvent)?.body;

      if (type === 'start') {
        initDomEventListener();
        showContentSelectorRef.current = true;
      } else if (type === 'reset') {
        resetStyle();
        removeDomEventListener();
        showContentSelectorRef.current = false;
      } else if (type === 'stop') {
        resetMarkStyle();
        removeDomEventListener();
        showContentSelectorRef.current = false;
      }
    }

    if ((data as SyncMarkEvent)?.name === 'syncMarkEvent') {
      const { mark, type } = (data as SyncMarkEvent)?.body;

      if (type === 'remove') {
        const xPath = mark?.xPath || '';
        const target = markListRef.current.find((item) => item.xPath === xPath)?.target;
        removeMark(target as HTMLElement, xPath);
      }
    }
  };

  const injectContentSelectorCss = () => {
    const style = document.createElement('style');
    style.textContent = `
        * {
        cursor: default !important;
      }
      .refly-content-selector-mark {
        cursor: pointer !important;
      }
      .refly-content-selector-mark:hover {
        background-color: #00968F26 !important;
        border-radius: 4px;
      }

      .refly-content-selected-target {
        background-color: #00968F26 !important;
        border-radius: 4px;
      }
        `;
    document.head.appendChild(style);
  };

  const initMessageListener = () => {
    injectContentSelectorCss();
    onMessage(contentSelectorStatusHandler, getRuntime()).then((clearEvent) => {
      messageListenerEventRef.current = clearEvent;
    });

    return () => {
      messageListenerEventRef.current?.();
      removeDomEventListener();
    };
  };

  const contentSelectorElem = (
    <div className="refly-content-selector-container">
      <div
        ref={markRef}
        style={{
          backgroundColor: '#4d53e826 !important',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
        className={classNames('refly-content-selector-mark', 'refly-content-selector-mark--active')}
      ></div>
    </div>
  );

  return {
    contentSelectorElem,
    injectContentSelectorCss,
    initMessageListener,
  };
};
