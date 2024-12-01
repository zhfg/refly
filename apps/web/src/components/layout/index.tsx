import { Layout } from "@arco-design/web-react"
import { useMatch } from "react-router-dom"
import { SiderLayout } from "./sider"
import { useBindCommands } from "@refly-packages/ai-workspace-common/hooks/use-bind-commands"
import { useNewCanvasModalStoreShallow } from "@refly-packages/ai-workspace-common/stores/new-canvas-modal"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"

import { LoginModal } from "@/components/login-modal"
import { BigSearchModal } from "@refly-packages/ai-workspace-common/components/search/modal"
import { SubscribeModal } from "@refly-packages/ai-workspace-common/components/settings/subscribe-modal"
import { NewCanvasModal } from "@/components/new-canvas-modal"

import "./index.scss"

const Content = Layout.Content

interface AppLayoutProps {
  children?: any
}

export const AppLayout = (props: AppLayoutProps) => {
  // stores
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
    loginModalVisible: state.loginModalVisible,
  }))
  const newCanvasModalStore = useNewCanvasModalStoreShallow(state => ({
    newCanvasModalVisible: state.newCanvasModalVisible,
  }))

  const matchShare = useMatch("/share/:shareCode")

  useBindCommands()

  const showSider = !matchShare && !!userStore.userProfile

  return (
    <Layout className="app-layout main">
      {showSider ? <SiderLayout source="sider" /> : null}
      <Layout
        className="content-layout"
        style={{
          height: "calc(100vh)",
          flexGrow: 1,
          overflowY: "auto",
          width: showSider ? `calc(100% - 200px - 16px)` : `calc(100% - 16px)`,
        }}>
        <Content>{props.children}</Content>
      </Layout>
      {userStore.loginModalVisible ? <LoginModal /> : null}
      <BigSearchModal />
      {newCanvasModalStore.newCanvasModalVisible ? <NewCanvasModal /> : null}
      <SubscribeModal />
    </Layout>
  )
}
