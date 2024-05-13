import { useEffect } from "react"
import { useMatch, useNavigate } from "react-router-dom"

// request
import getUserInfo from "@/requests/getUserInfo"
import putUserInfo from "@/requests/putUserInfo"
import {
  LocalSettings,
  defaultLocalSettings,
  useUserStore,
} from "@/stores/user"
import { safeStringifyJSON } from "@/utils/parse"
import { mapCNLocale } from "@/utils/locale"
import { useCookie } from "react-use"
import { LOCALE } from "@/types"
import { useTranslation } from "react-i18next"

export const useGetUserSettings = () => {
  const userStore = useUserStore()
  const navigate = useNavigate()

  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid")
  const { i18n } = useTranslation()

  const routeLandingPageMatch = useMatch("/")
  const routePrivacyPageMatch = useMatch("/privacy")
  const routeTermsPageMatch = useMatch("/terms")
  const routeLoginPageMatch = useMatch("/login")
  const routeDigestDetailPageMatch = useMatch("/digest/:digestId")
  const routeFeedDetailPageMatch = useMatch("/feed/:feedId")
  const routeAIGCContentDetailPageMatch = useMatch("/content/:digestId")
  const routeThreadDetailPageMatch = useMatch("/thread/:threadId")

  const getLoginStatus = async () => {
    try {
      const res = await getUserInfo()
      let { localSettings } = useUserStore.getState()

      console.log("loginStatus", res)

      if (!res?.success) {
        userStore.setUserProfile(undefined)
        userStore.setToken("")
        userStore.resetState()
        localStorage.removeItem("refly-user-profile")
        localStorage.removeItem("refly-local-settings")

        if (
          routeLandingPageMatch ||
          routePrivacyPageMatch ||
          routeTermsPageMatch ||
          routeLoginPageMatch ||
          routeDigestDetailPageMatch ||
          routeFeedDetailPageMatch ||
          routeAIGCContentDetailPageMatch ||
          routeThreadDetailPageMatch
        ) {
          console.log("命中不需要鉴权页面，直接展示")
        } else {
          navigate("/")
        }
      } else {
        userStore.setUserProfile(res?.data)
        localStorage.setItem("refly-user-profile", safeStringifyJSON(res?.data))

        // 增加 localSettings
        let uiLocale = mapCNLocale(res?.data?.uiLocale as LOCALE) as LOCALE
        let outputLocale = mapCNLocale(
          res?.data?.outputLocale as LOCALE,
        ) as LOCALE

        // 先写回
        localSettings = {
          ...localSettings,
          uiLocale,
          outputLocale,
          isLocaleInitialized: true,
        }

        // 说明是第一次注册使用，此时没有 locale，需要写回
        if (!uiLocale && !outputLocale) {
          uiLocale = mapCNLocale(
            (navigator?.language || LOCALE.EN) as LOCALE,
          ) as LOCALE
          outputLocale = mapCNLocale(
            (navigator?.language || LOCALE.EN) as LOCALE,
          ) as LOCALE
          // 不阻塞写回用户配置
          putUserInfo({
            body: { uiLocale, outputLocale },
          })

          // 如果是初始化的再替换
          localSettings = {
            ...localSettings,
            uiLocale,
            outputLocale,
            isLocaleInitialized: false,
          } as LocalSettings
        }

        // 应用 locale
        i18n.changeLanguage(uiLocale)

        userStore.setLocalSettings(localSettings)
        localStorage.setItem("refly-user-profile", safeStringifyJSON(res?.data))
        localStorage.setItem(
          "refly-local-settings",
          safeStringifyJSON(localSettings),
        )
      }
    } catch (err) {
      console.log("getLoginStatus err", err)
      userStore.setUserProfile(undefined)
      userStore.setLocalSettings(defaultLocalSettings)
      userStore.setToken("")
      localStorage.removeItem("refly-user-profile")
      localStorage.removeItem("refly-local-settings")
    }
  }

  useEffect(() => {
    getLoginStatus()
  }, [token, userStore.loginModalVisible])
}
