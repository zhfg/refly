import { useEffect, useRef } from "react";
import { useContentSelectorStore } from "@/stores/content-selector";
import { safeParseJSON } from "@/utils/parse";
import { sendToBackground } from "@/utils/extension-message";
// stores

export const useSelectedMark = () => {
  const contentSelectorStore = useContentSelectorStore();
  const { setMarks, setShowSelectedMarks, resetState } =
    useContentSelectorStore();

  // 从 content-selector-app 获取信息，以此和 main-app 解耦合
  const contentSelectedHandler = (event: MessageEvent<any>) => {
    const data = event?.data || {};
    if (data?.name === "syncSelectedMark") {
      const marks = safeParseJSON(data?.payload?.marks);

      contentSelectorStore.setMarks(marks);
    }
  };

  const handleToggleContentSelector = (showContentSelector: boolean) => {
    contentSelectorStore.setShowContentSelector(showContentSelector);

    // 这里打开
    if (!contentSelectorStore.showContentSelector) {
      contentSelectorStore.setShowSelectedMarks(true);
    }

    if (!contentSelectorStore?.isInjectStyles) {
      sendToBackground({
        name: "injectContentSelectorCSS",
      });

      contentSelectorStore?.setIsInjectStyles(true);
    }

    window.postMessage({
      name: "setShowContentSelector",
      payload: {
        showContentSelector,
      },
    });
  };

  const handleRemoveMark = (xPath: string) => {
    window.postMessage({
      name: "removeSelectedMark",
      payload: {
        xPath,
      },
    });

    const { marks } = useContentSelectorStore.getState();
    const newMarks = marks.filter((item) => item?.xPath !== xPath);
    setMarks(newMarks);
  };

  const handleRemoveAll = () => {
    window.postMessage({
      name: "removeAllSelectedMark",
    });
  };

  const handleExit = () => {
    handleRemoveAll();

    setShowSelectedMarks(false);
  };

  const handleResetState = () => {
    handleToggleContentSelector(false);

    resetState();
    handleExit();
  };

  useEffect(() => {
    window.addEventListener("message", contentSelectedHandler);

    return () => {
      document.body.removeEventListener("message", contentSelectedHandler);
    };
  }, []);

  return {
    handleToggleContentSelector,
    handleExit,
    handleRemoveAll,
    handleResetState,
    handleRemoveMark,
  };
};
