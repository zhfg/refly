import { useEffect } from "react"
import {
  useMatch,
  useNavigate,
} from "@refly-packages/ai-workspace-common/utils/router"

// request
import getClient from "@refly-packages/ai-workspace-common/requests/proxiedRequest"
import {
  defaultLocalSettings,
  useUserStore,
} from "@refly-packages/ai-workspace-common/stores/user"
import { useCookie } from "react-use"
import { getClientOrigin } from "@refly/utils/url"

/**
 * Landing Page 独有的用户设置
 */
export const useGetUserSettings = () => {
  const userStore = useUserStore()
  const navigate = useNavigate()

  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid")

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
      const res = await getClient().getSettings()
      console.log("loginStatus", res)

      if (res.error || !res.data) {
        userStore.setUserProfile(undefined)
        userStore.setToken("")
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
        // 鉴权成功直接重定向到 app.refly.ai
        window.location.href = getClientOrigin(false)
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
