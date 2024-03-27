import React from "react"
import { Route, Routes, useMatch } from "react-router-dom"

// 自定义组件
import Dashboard from "@/components/dashboard"
import { Thread } from "@/components/thread-item/thread"
import { ThreadLibrary } from "@/components/thread-library"
import { Settings } from "@/components/settings/index"
import { Login } from "@/components/login/index"
import LandingPage from "@/pages/landing-page"
import Privacy from "@/pages/pravicy"
import Terms from "@/pages/terms"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  const routeLandingPageMatch = useMatch("/")
  const routePrivacyPageMatch = useMatch("/privacy")
  const routeTermsPageMatch = useMatch("/terms")
  const routeLoginPageMatch = useMatch("/login")
  // 导航相关

  if (
    routeLandingPageMatch ||
    routePrivacyPageMatch ||
    routeTermsPageMatch ||
    routeLoginPageMatch
  ) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/thread" element={<ThreadLibrary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  )
}
