import React from "react"
import { Route, Routes, useMatch } from "react-router-dom"

// 自定义组件
import Dashboard from "@/components/dashboard"
import { Thread } from "@/components/thread-item/thread"
import { ThreadLibrary } from "@/components/thread-library"
import { Settings } from "@/components/settings/index"
import { Login } from "@/components/login/index"
import LandingPage from "@/pages/landing-page"
import { Feed} from "@/pages/feed"
import { Digest } from "@/pages/DailyDigest"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  const routeMatch = useMatch("/")
  // 导航相关

  if (routeMatch) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/thread" element={<ThreadLibrary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  )
}
