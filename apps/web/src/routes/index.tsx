import { lazy, Suspense } from "react"
import { Route, Routes, useMatch } from "react-router-dom"
import { Spin } from "@arco-design/web-react"
import { useEffect } from "react"
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import { useTranslation } from "react-i18next"
import { useGetUserSettings } from "@refly-packages/ai-workspace-common/hooks/use-get-user-settings"
import { LOCALE } from "@refly/common-types"

// Lazy load components
const Workspace = lazy(() => import("@/pages/workspace"))
const ConvLibrary = lazy(() => import("@/pages/conv-library"))
const KnowledgeBase = lazy(() => import("@/pages/knowledge-base"))
const Skill = lazy(() => import("@/pages/skill"))
const SkillDetailPage = lazy(() => import("@/pages/skill-detail"))
const Settings = lazy(() => import("@/pages/settings"))
const Login = lazy(() => import("@/pages/login"))

// Loading component
const LoadingFallback = () => (
  <div
    style={{
      height: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
    <Spin />
  </div>
)

const prefetchRoutes = () => {
  // Prefetch common routes
  import("@/pages/login")
  import("@/pages/workspace")
  import("@/pages/knowledge-base")
  import("@/pages/conv-library")
  import("@/pages/skill")
  import("@/pages/skill-detail")
  import("@/pages/settings")
}

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
    localSettings: state.localSettings,
    isCheckingLoginStatus: state.isCheckingLoginStatus,
  }))

  // Get storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  const notShowLoginBtn = storageUserProfile?.uid || userStore?.userProfile?.uid

  // Get locale settings
  const storageLocalSettings = safeParseJSON(
    localStorage.getItem("refly-local-settings"),
  )
  const locale =
    storageLocalSettings?.uiLocale ||
    userStore?.localSettings?.uiLocale ||
    LOCALE.EN

  useEffect(() => {
    prefetchRoutes()
  }, [])

  // Check user login status
  useGetUserSettings()

  // Change locale if not matched
  const { i18n } = useTranslation()
  useEffect(() => {
    if (locale && i18n.languages?.[0] !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [i18n, locale])

  const routeLogin = useMatch("/login")

  if (
    userStore.isCheckingLoginStatus === undefined ||
    userStore.isCheckingLoginStatus
  ) {
    return <LoadingFallback />
  }

  if (!notShowLoginBtn && !routeLogin) {
    return <LoadingFallback />
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Layout>
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/login" element={<Login />} />
          <Route path="/thread" element={<ConvLibrary />} />
          <Route path="/skill" element={<Skill />} />
          <Route path="/skill-detail" element={<SkillDetailPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Suspense>
  )
}
