import React, { type Dispatch, useEffect, useRef, useState } from "react";
// stores
import { useSiderStore } from "@/src/stores/sider";

export const useSetContainerDimension = () => {
  const siderStore = useSiderStore();

  useEffect(() => {
    // Sidebar 唤起后更改 html 宽度，达到挤压的效果
    const html = document.querySelector("html");
    html.style.position = "relative";
    html.style.minHeight = "100vh";
    if (siderStore.showSider) {
      const { clientWidth = 0 } =
        document
          .querySelector("#refly-main-app")
          ?.shadowRoot?.querySelector(".main") || {};
      html.style.width = `calc(100vw - ${clientWidth}px)`;
    } else {
      html.style.width = "100vw";
    }
  }, [siderStore.showSider]);
};
