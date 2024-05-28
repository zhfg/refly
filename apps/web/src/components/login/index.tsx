import React, { useEffect } from "react"

import { LoginModal } from "../login-modal/index"

export const Login = () => {
  // 来自插件页面登录跳转，打个标，然后后续基于这个标做状态控制
  useEffect(() => {
    localStorage.setItem("refly-login-status", "true")
    console.log(
      "refly-login-status",
      localStorage.getItem("refly-login-status"),
    )
  }, [])

  return (
    <>
      <LoginModal visible={true} from="extension-login" />
    </>
  )
}
