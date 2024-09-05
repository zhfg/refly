import { useEffect } from "react"
import { Route, Routes, useMatch } from "react-router-dom"

// 自定义组件
import { ConvLibrary } from "@/pages/conv-library"
import { Settings } from "@refly-packages/ai-workspace-common/components/settings/index"
import { Login } from "@refly-packages/ai-workspace-common/components/login/index"

// 页面
import Workspace from "@/pages/workspace"
import KnowledgeBase from "@/pages/knowledge-base"
import Skill from "@/pages/skill"
import SkillDetailPage from "@/pages/skill-detail"

// 这里用于分享之后的不需要鉴权的查看
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { useTranslation } from "react-i18next"
import { useGetUserSettings } from "@refly-packages/ai-workspace-common/hooks/use-get-user-settings"
import { LOCALE } from "@refly/common-types"
import { Spin } from "@arco-design/web-react"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  const userStore = useUserStore()

  const { i18n } = useTranslation()
  const language = i18n.languages?.[0]

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

  const routeLogin = useMatch("/login")

  if (!notShowLoginBtn && !routeLogin) {
    return (
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
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Workspace />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/feed" element={<Feed />} /> */}
        {/* <Route path="/feed/:feedId" element={<FeedDetailPage />} /> */}
        <Route path="/thread" element={<ConvLibrary />} />
        <Route path="/skill" element={<Skill />} />
        <Route path="/skill-detail" element={<SkillDetailPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
