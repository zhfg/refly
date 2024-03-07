import { Layout } from "@arco-design/web-react"
import { SiderLayout } from "./sider"

const Content = Layout.Content

interface AppLayoutProps {
  children?: any
}

export const AppLayout = (props: AppLayoutProps) => {
  return (
    <Layout className="app-layout">
      <SiderLayout />
      <Layout
        className="app-layout"
        style={{ height: "100vh", minWidth: 1256 }}>
        <Content>{props.children}</Content>
      </Layout>
    </Layout>
  )
}
