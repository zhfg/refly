import React, { useEffect } from "react"
import { Route, Routes, useMatch } from "react-router-dom"

// 自定义组件
import Dashboard from "@/components/dashboard"
import { Thread } from "@/components/thread-item/thread"
import { ThreadLibrary } from "@/components/thread-library"
import { Settings } from "@/components/settings/index"
import { Login } from "@/components/login/index"
import LandingPage from "@/pages/landing-page"
import { DigestToday } from "@/pages/digest-today"
import { DigestTopics } from "@/pages/digest-topics/index"
import { DigestTopicDetail } from "@/pages/digest-topic-detail/index"
import Privacy from "@/pages/pravicy"
import Terms from "@/pages/terms"
import { DigestArchive } from "@/pages/digest-timeline"

// digest 详情
import { DigestDetailPage } from "@/pages/digest-detail"
// 页面
import Workspace from "@/pages/workspace"

// 这里用于分享之后的不需要鉴权的查看
import { AIGCContentDetailPage } from "@/pages/aigc-content-detail"
import { safeParseJSON } from "@/utils/parse"
import { useUserStore } from "@/stores/user"
import { useTranslation } from "react-i18next"
import { useGetUserSettings } from "@/hooks/use-get-user-settings"
import { LOCALE } from "@/types"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  const userStore = useUserStore()

  const { i18n } = useTranslation()
  const language = i18n.languages?.[0]

  // 不需要鉴权即可访问的路由
  const routeLandingPageMatch = useMatch("/")
  const routePrivacyPageMatch = useMatch("/privacy")
  const routeTermsPageMatch = useMatch("/terms")
  const routeLoginPageMatch = useMatch("/login")
  // 导航相关

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  const notShowLoginBtn = storageUserProfile?.uid || userStore?.userProfile?.uid

  // 获取 locale
  const storageLocalSettings = safeParseJSON(
    localStorage.getItem("refly-local-settings"),
  )
  const locale =
    storageLocalSettings?.uiLocale ||
    userStore?.localSettings?.uiLocale ||
    LOCALE.EN

  // 这里进行用户登录信息检查
  useGetUserSettings()

  // TODO: 国际化相关内容
  useEffect(() => {
    if (locale && language !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [locale])

  if (
    (routeLandingPageMatch && !notShowLoginBtn) ||
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
        <Route path="/" element={<Workspace />} />
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
        {/** dateType: daily/weekly/monthly/yearly */}
        <Route
          path="/digest/:dateType/:year/:month/:day"
          element={<DigestArchive />}
        />
      </Routes>
    </Layout>
  )
}
