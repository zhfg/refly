import { Layout } from "@arco-design/web-react"
import { SiderLayout } from "./sider"
import "./index.scss"

const Content = Layout.Content

interface AppLayoutProps {
  children?: any
}

export const AppLayout = (props: AppLayoutProps) => {
  return (
    <Layout className="app-layout main">
      <SiderLayout />
      <Layout
        className="content-layout"
        style={{ height: "calc(100vh - 16px)", flexGrow: 1 }}>
        <Content>{props.children}</Content>
      </Layout>
    </Layout>
  )
}
