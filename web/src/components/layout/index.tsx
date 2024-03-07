import { Layout } from "@arco-design/web-react"
import { SiderLayout } from "./sider"
import "./index.scss"

const Content = Layout.Content

interface AppLayoutProps {
  children?: any
}

export const AppLayout = (props: AppLayoutProps) => {
  return (
    <Layout className="app-layout">
      <SiderLayout />
      <Layout
        className="content-layout"
        style={{ height: "calc(100vh - 16px)", minWidth: 1256 }}>
        <Content>{props.children}</Content>
      </Layout>
    </Layout>
  )
}
