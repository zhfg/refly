import { useEffect } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import AOS from "aos"

// 自定义组件
import { Login } from "@refly-packages/ai-workspace-common/components/login/index"
import Privacy from "@/pages/pravicy"
import Terms from "@/pages/terms"
import Home from "@/pages/Home"
import { Helmet } from "react-helmet"
import { LoginModal } from "@refly-packages/ai-workspace-common/components/login-modal"
import { WaitingListModal } from "@/components/waiting-list-modal"

// utils
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { useTranslation } from "react-i18next"
import { useGetUserSettings } from "@/hooks/use-get-user-settings"
import { LOCALE } from "@refly/common-types"

// 样式
import "aos/dist/aos.css"
import "@/styles/style.css"

export const AppRouter = () => {
  const userStore = useUserStore()

  const { i18n } = useTranslation()
  const language = i18n.languages?.[0]

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

  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 600,
      easing: "ease-out-sine",
    })
  })

  useEffect(() => {
    document.querySelector("html")!.style.scrollBehavior = "auto"
    window.scroll({ top: 0 })
    document.querySelector("html")!.style.scrollBehavior = ""
  }, [location.pathname]) // triggered on route change

  return (
    <>
      <Helmet>
        <title>
          {t("productName")} | {t("landingPage.slogan")}
        </title>
        <meta name="description" content={t("landingPage.description")} />
      </Helmet>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
      <WaitingListModal />
      <LoginModal />
    </>
  )
}
