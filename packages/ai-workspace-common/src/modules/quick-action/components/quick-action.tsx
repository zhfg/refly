import { Dropdown, Trigger } from '@arco-design/web-react';
import React, { useEffect, useRef, useState } from 'react';
import Logo from '../../../assets/logo.svg';

import { CustomPromptList } from '../utils/quick-action';
import { useBarPosition } from '../hooks/useToolBarPosition';
import { useQuickActionStore } from '../stores/quick-action';

import PopupWindow from './popup-window';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { QuickActionToolbar } from './quick-action-toolbar';
// styles
import '../styles/index.scss';

type QuickActionProps = {};

export const QuickAction = (props: QuickActionProps) => {
  const barPosition = useBarPosition();

  const quickActionToolbarVisible = useQuickActionStore((state) => state.quickActionToolbarVisible);
  const popupVisible = useQuickActionStore((state) => state.popupVisible);
  const isShowSide = useQuickActionStore((state) => state.isShowSide);
  const updateUIState = useQuickActionStore((state) => state.updateUIState);
  const [customPromptList, setCustomPromptList] = useState(CustomPromptList);
  const pageSize = 50;
  const currentPage = useRef(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  /**
   * 获取快捷指令
   */

  const handleGetCustomPromptList = async () => {
    setLoading(true);

    const body = {
      pageSize,
      page: currentPage.current,
    };

    // const res = await sendToBackground({
    //   name: 'getCustomPromptList',
    //   body,
    // });
    // 判断是否是最后一页
    // if (res.data) {
    //   if (currentPage.current === res.data.totalPages) {
    //     setHasMore(() => false);
    //   } else {
    //     setHasMore(() => true);
    //   }

    //   setCustomPromptList(CustomPromptList.concat(res.data.data || []));
    // }
    setLoading(false);
  };

  // 滚动加载更多
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    // 滚动到了底部且还有会话可以加载
    if (scrollTop + clientHeight === scrollHeight && hasMore) {
      currentPage.current += 1;
      handleGetCustomPromptList();
    }
  };

  useEffect(() => {
    handleGetCustomPromptList();
  }, [popupVisible]);

  /**
   * 获取快捷操作的响应，这里抽离出来是为了方便后续扩展
   * @param modeParams
   */

  console.log('quickActionToolbarVisible', quickActionToolbarVisible);

  return (
    <div
      className="float-quick-action-btn-wrapper"
      style={barPosition}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {quickActionToolbarVisible && <QuickActionToolbar />}
      <Trigger
        trigger="click"
        position="bottom"
        popup={() => <PopupWindow customPromptList={customPromptList} getPopupContainer={getPopupContainer} />}
        // popupAlign={{
        //   top: [-120, 0],
        // }}
        popupVisible={popupVisible}
        onVisibleChange={(visible) => {
          // 如果 popup 关掉了，那么也应该 shutdown 请求，解决内容混乱问题
        }}
        getPopupContainer={getPopupContainer}
        style={{ maxWidth: 600 }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        ></div>
      </Trigger>
    </div>
  );
};
