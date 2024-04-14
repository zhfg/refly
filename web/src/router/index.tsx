import React from "react"
import { Route, Routes, useMatch } from "react-router-dom"

// 自定义组件
import Dashboard from "@/components/dashboard"
import { Thread } from "@/components/thread-item/thread"
import { ThreadLibrary } from "@/components/thread-library"
import { Settings } from "@/components/settings/index"
import { Login } from "@/components/login/index"
import LandingPage from "@/pages/landing-page"
import { Feed } from "@/pages/feed"
import { DigestToday } from "@/pages/digest-today"
import { DigestTopics } from "@/pages/digest-topics/index"
import { DigestTopicDetail } from "@/pages/digest-topic-detail/index"
import Privacy from "@/pages/pravicy"
import Terms from "@/pages/terms"
import { DigestArchive } from "@/pages/digest-archive"

// digest 详情
import { DigestDetailPage } from "@/pages/digest-detail"
import { FeedDetailPage } from "@/pages/feed-detail"
// 这里用于分享之后的不需要鉴权的查看
import { AIGCContentDetailPage } from "@/pages/aigc-content-detail"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props

  // 不需要鉴权即可访问的路由
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
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/feed" element={<Feed />} /> */}
        <Route path="/digest" element={<DigestToday />} />
        <Route path="/digest/topics" element={<DigestTopics />} />
        <Route path="/content/:digestId" element={<AIGCContentDetailPage />} />
        <Route path="/digest/:digestId" element={<DigestDetailPage />} />
        {/* <Route path="/feed/:feedId" element={<FeedDetailPage />} /> */}
        <Route
          path="/digest/topic/:digestTopicId"
          element={<DigestTopicDetail />}
        />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/thread" element={<ThreadLibrary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/** dateType: daily/weekly/monthly/yearly */}
        <Route
          path="/digest/:dateType/:year/:month/:day"
          element={<DigestArchive />}
        />
      </Routes>
    </Layout>
  )
}
