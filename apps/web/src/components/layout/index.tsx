import { Layout } from "@arco-design/web-react"

import { SiderLayout } from "./sider"
import { useBindCommands } from "@refly-packages/ai-workspace-common/hooks/use-bind-commands"
import { useImportResourceStoreShallow } from "@refly-packages/ai-workspace-common/stores/import-resource"
import { useImportProjectModalShallow } from "@refly-packages/ai-workspace-common/stores/import-project-modal"
import { useNewCanvasModalStoreShallow } from "@refly-packages/ai-workspace-common/stores/new-canvas-modal"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"

import { LoginModal } from "@/components/login-modal"
import { BigSearchModal } from "@refly-packages/ai-workspace-common/components/search/modal"
import { ImportResourceModal } from "@refly-packages/ai-workspace-common/components/import-resource"
import { NewProjectModal } from "@refly-packages/ai-workspace-common/components/project-detail/new-project-modal"
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
    loginModalVisible: state.loginModalVisible,
  }))
  const importResourceStore = useImportResourceStoreShallow(state => ({
    importResourceModalVisible: state.importResourceModalVisible,
  }))
  const newCanvasModalStore = useNewCanvasModalStoreShallow(state => ({
    newCanvasModalVisible: state.newCanvasModalVisible,
  }))
  const importProjectModal = useImportProjectModalShallow(state => ({
    showNewProjectModal: state.showNewProjectModal,
  }))

  // 绑定快捷键
  useBindCommands()

  return (
    <Layout className="app-layout main">
      <SiderLayout />
      <Layout
        className="content-layout"
        style={{
          height: "calc(100vh - 16px)",
          flexGrow: 1,
          overflowY: "auto",
          width: `calc(100% - 200px - 16px)`,
        }}>
        <Content>{props.children}</Content>
      </Layout>
      {userStore.loginModalVisible ? <LoginModal /> : null}
      <BigSearchModal />
      {importResourceStore.importResourceModalVisible ? (
        <ImportResourceModal />
      ) : null}
      {newCanvasModalStore.newCanvasModalVisible ? <NewCanvasModal /> : null}
      {importProjectModal.showNewProjectModal && <NewProjectModal />}
      <SubscribeModal />
    </Layout>
  )
}
