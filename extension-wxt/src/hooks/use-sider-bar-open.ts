import { useSiderStore } from "@/src/stores/sider";
import { useEffect } from "react";

interface SiderBarStatus {
  name: string;
  toggle: boolean;
}

export const useSiderBarOpen = () => {
  const siderStore = useSiderStore();

  const [siderBarStatusData] = useExtensionMessage<SiderBarStatus>(
    (req, res) => {
      const { showSider } = useSiderStore.getState();
      res.send(showSider ? "true" : "false");
    }
  );

  const handlerSiderOpen = (data?: SiderBarStatus) => {
    const { showSider } = useSiderStore.getState();
    if (data?.name === "runRefly" && data?.toggle) {
      siderStore.setShowSider(!showSider);
    }
  };

  useEffect(() => {
    handlerSiderOpen(siderBarStatusData?.data);
  }, [siderBarStatusData?.data]);
};
