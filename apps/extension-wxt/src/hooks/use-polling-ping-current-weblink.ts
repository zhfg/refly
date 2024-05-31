import { useEffect, useRef } from 'react';
import type { IndexStatus, WebLinkItem } from '@/components/weblink-list/types';
import { useSiderStore } from '@/stores/sider';
import { useUserStore } from '@/stores/user';
import { useWeblinkStore } from '@/stores/weblink';
import { buildCurrentWeblink } from '@/utils/weblink';
import { apiRequest } from '@/requests/apiRequest';

export const usePollingPingCurrentWeblink = () => {
  const pingFuncRef = useRef<NodeJS.Timer>();
  const weblinkStore = useWeblinkStore();
  const userStore = useUserStore();
  const siderStore = useSiderStore();

  // 检查是否满足 startPing 的条件
  const checkValidStartPing = () => {
    const { userProfile } = useUserStore.getState();
    const { currentWeblink } = useWeblinkStore.getState();
    const { showSider } = useSiderStore.getState();

    const isLogged = !!userProfile?.uid;
    const isCurrentWeblinkStatusNotComplete = ['init', 'processing'].includes(currentWeblink?.parseStatus);

    if (isLogged && showSider && (isCurrentWeblinkStatusNotComplete || !currentWeblink)) {
      return true;
    }

    return false;
  };

  const isLogged = !!userStore?.userProfile?.uid;
  const isValidStartPing = checkValidStartPing();
  const showSider = siderStore?.showSider;
  console.log('isLogged', isLogged, isValidStartPing);

  /**
   * 用于轮训 Ping 当前打开的网页，登录状态下，2S 轮训一次
   *
   * 状态机：1）初始 Init 2）开始轮训并初始化 currentWeblink 3) 轮训 4）直到状态完毕
   */
  const pingCurrentWeblink = async () => {
    if (!checkValidStartPing()) {
      return;
    }

    // check 初始化状态
    const currentState = useWeblinkStore.getState();
    let currentWeblink = currentState?.currentWeblink;

    if (!currentWeblink) {
      currentWeblink = buildCurrentWeblink() as WebLinkItem;
      weblinkStore.setCurrentWeblink(currentWeblink);
    }

    // 开启轮训
    // TODO: 不一定是 apiRequest，只是单纯的通信
    const pingRes = await apiRequest({
      name: 'pingWebLinkStatus',
      method: 'GET',
      body: {
        url: currentWeblink?.originPageUrl,
      },
    });

    console.log('currentWeblink pingRes', pingRes);

    // 如果服务调用失败，直接静默失败，且持续轮训，这里直接将 ping 结果写回 currentWeblink
    if (pingRes?.success) {
      const { currentWeblink } = useWeblinkStore.getState();
      weblinkStore.setCurrentWeblink({
        ...currentWeblink,
        ...((pingRes?.data as WebLinkItem) || {}),
      });
    }
  };

  const startPollingPing = () => {
    clearPollingPing(); // 开启新轮训时，先清除上一个轮训
    pingCurrentWeblink(); // 立马运行一次，然后开始轮训
    pingFuncRef.current = setInterval(pingCurrentWeblink, 2000);
  };
  const clearPollingPing = () => {
    if (pingFuncRef.current) {
      clearInterval(pingFuncRef.current);
    }
  };

  const listenWebpageVisibilityChange = () => {
    // 如果网页隐藏，清除轮训
    if (document.hidden) {
      clearPollingPing();
    } else {
      if (checkValidStartPing()) {
        startPollingPing();
      }
    }
  };

  useEffect(() => {
    /**
     * 1. 网页状态：document hide/visible
     */
    document.addEventListener('visibilitychange', listenWebpageVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', listenWebpageVisibilityChange);

      clearPollingPing();
    };
  }, []);

  // 如果登录状态发生变化，且当前网页状态满足 startPing 的条件，则开始轮训
  useEffect(() => {
    if (isLogged && isValidStartPing && showSider) {
      startPollingPing();
    }
  }, [isLogged, isValidStartPing, showSider]);
};
