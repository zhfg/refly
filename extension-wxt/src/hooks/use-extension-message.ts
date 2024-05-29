import { useEffect, useState } from "react";
import { useSiderStore } from "@/src/stores/sider";

export const useExtensionMessage = <T>(
  onCallback: (
    req: chrome.runtime.MessageSender,
    res: { send: (response?: any) => void }
  ) => void
) => {
  const [extensionData, setExtensionData] = useState<{ data: T }>();

  const listenToExtensionMessage = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    setExtensionData(message);
    onCallback(sender, {
      send: sendResponse,
    });
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(listenToExtensionMessage as any);

    return () => {
      browser.runtime.onMessage.removeListener(listenToExtensionMessage as any);
    };
  }, []);

  return [extensionData];
};
