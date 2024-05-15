import { useUserStore } from "@/stores/user"
import { safeParseJSON } from "@/utils/parse"
import { useRef } from "react"

export const useIsLogin = () => {
  const isLoggedRef = useRef<boolean>(false)
  const userStore = useUserStore()

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  isLoggedRef.current = storageUserProfile?.uid || userStore?.userProfile?.uid

  return {
    isLoggedRef,
  }
}
