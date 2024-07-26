import { Layout } from "@arco-design/web-react"

import { SiderLayout } from "./sider"
import "./index.scss"
import { useUserStore } from "@refly/ai-workspace-common/stores/user"

// 组件
import { LoginModal } from "@refly/ai-workspace-common/components/login-modal/index"
import { QuickSearchModal } from "@refly/ai-workspace-common/components/quick-search-modal"
import { BigSearchModal } from "@refly/ai-workspace-common/components/search/modal"
import { ImportResourceModal } from "@refly/ai-workspace-common/components/import-resource"

// stores
import { useQuickSearchStateStore } from "@refly/ai-workspace-common/stores/quick-search-state"
import { useBindCommands } from "@refly/ai-workspace-common/hooks/use-bind-commands"
import { useSearchStore } from "@refly/ai-workspace-common/stores/search"
import { useImportResourceStore } from "@refly/ai-workspace-common/stores/import-resource"

const Content = Layout.Content

interface AppLayoutProps {
  children?: any
}

export const AppLayout = (props: AppLayoutProps) => {
  // stores
  const userStore = useUserStore()
  const importResourceStore = useImportResourceStore()

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
          overflowY: "scroll",
          width: `calc(100% - 200px - 16px)`,
        }}>
        <Content>{props.children}</Content>
      </Layout>
      {userStore.loginModalVisible ? <LoginModal /> : null}
      <BigSearchModal />
      {importResourceStore.importResourceModalVisible ? (
        <ImportResourceModal />
      ) : null}
    </Layout>
  )
}
