import React, { useEffect } from "react"

import { LoginModal } from "../login-modal/index"
import { useLocation, useParams, useSearchParams } from "react-router-dom"

export const Login = () => {
  const [searchParams] = useSearchParams()

  // 来自插件页面登录跳转，打个标，然后后续基于这个标做状态控制
  useEffect(() => {
    if (searchParams.get("from") === "refly-extension-login") {
      localStorage.setItem("refly-login-status", "true")
    }
  }, [])

  return (
    <>
      <LoginModal visible={true} from="extension-login" />
    </>
  )
}
