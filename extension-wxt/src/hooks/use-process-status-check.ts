import { useEffect } from "react";
import { useGetUserSettings } from "./use-get-user-settings";

export const useProcessStatusCheck = () => {
  const { getLoginStatus } = useGetUserSettings();

  // 收到消息之后，关闭窗口
  const handleExtensionMessage = (request: any) => {
    console.log("activate useProcessLogoutNotify", request);
    if (request?.name === "refly-status-check") {
      getLoginStatus();
    }
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleExtensionMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleExtensionMessage);
    };
  }, []);
};
