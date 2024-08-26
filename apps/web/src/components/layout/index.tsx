import { Layout, Spin } from "@arco-design/web-react"
import { useState, useEffect } from "react"

import { SiderLayout } from "./sider"
import "./index.scss"
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"

// 组件
import { LoginModal } from "@refly-packages/ai-workspace-common/components/login-modal/index"
import { BigSearchModal } from "@refly-packages/ai-workspace-common/components/search/modal"
import { ImportResourceModal } from "@refly-packages/ai-workspace-common/components/import-resource"
import { NewKnowledgeModal } from "@refly-packages/ai-workspace-common/components/knowledge-base/new-knowledge-modal"

// stores
import { useBindCommands } from "@refly-packages/ai-workspace-common/hooks/use-bind-commands"
import { useSearchStore } from "@refly-packages/ai-workspace-common/stores/search"
import { useImportResourceStore } from "@refly-packages/ai-workspace-common/stores/import-resource"
import { useImportKnowledgeModal } from "@refly-packages/ai-workspace-common/stores/import-knowledge-modal"

const Content = Layout.Content

interface AppLayoutProps {
  children?: any
}

export const AppLayout = (props: AppLayoutProps) => {
  // stores
  const userStore = useUserStore()
  const importResourceStore = useImportResourceStore()
  const importKnowledgeModal = useImportKnowledgeModal()

  // 绑定快捷键
  useBindCommands()

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleLoadingChange = (event: CustomEvent) => {
      setIsLoading(event.detail.isLoading)
    }

    window.addEventListener(
      "globalLoadingChange",
      handleLoadingChange as EventListener,
    )

    return () => {
      window.removeEventListener(
        "globalLoadingChange",
        handleLoadingChange as EventListener,
      )
    }
  }, [])

  return (
    <Layout className="app-layout main">
      <SiderLayout />
      <Spin loading={isLoading} style={{ width: `calc(100% - 200px - 16px)` }}>
        <Layout
          className="content-layout"
          style={{
            height: "calc(100vh - 16px)",
            flexGrow: 1,
            overflowY: "auto",
            width: `100%`,
          }}>
          <Content>{props.children}</Content>
        </Layout>
      </Spin>
      {userStore.loginModalVisible ? <LoginModal /> : null}
      <BigSearchModal />
      {importResourceStore.importResourceModalVisible ? (
        <ImportResourceModal />
      ) : null}
      {importKnowledgeModal.showNewKnowledgeModal && <NewKnowledgeModal />}
    </Layout>
  )
}
