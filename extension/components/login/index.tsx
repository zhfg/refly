import { Button, Message as message } from "@arco-design/web-react"
import React, { useEffect, useRef, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"

// stores
import { useUserStore } from "~stores/user"
// storage
import { bgStorage } from "~storage/index"

// 静态资源
import Logo from "~assets/logo.svg"
import { useMessage } from "@plasmohq/messaging/hook"
import type { User } from "~types"
import { useNavigate } from "react-router-dom"
import { safeParseJSON } from "~utils/parse"
import { sendToBackground } from "@plasmohq/messaging"
import { getClientOrigin } from "~utils/url"
import { ChatHeader } from "~components/home/header"

interface ExternalLoginPayload {
  name: string
  body: {
    status: "success" | "failed"
    token?: string
    user?: User
  }
}

export const Login = () => {
  const userStore = useUserStore()
  const bgMessage = useMessage<ExternalLoginPayload, string>((req, res) => {
    res.send("recevied msg")
  })
  const navigate = useNavigate()
  const loginWindowRef = useRef<Window>()

  // 鉴权相关内容
  const [token, setToken] = useStorage("token")
  const [userProfile, setUserProfile] = useStorage("userProfile")
  const [loginNotification] = useStorage({
    key: "login-notification",
    instance: bgStorage,
  })

  /**
   * 0. 获取主站的登录态，如果没有登录就访问 Login 页面，已登录之后再展示可操作页面
   * 1. 打开一个弹窗，访问 Refly 主站进行登录
   * 2. 登录完之后，通过 chrome 的 API 给插件发消息，收到消息之后 reload 页面获取登录状态，然后持久化存储
   * 3. 之后带着 cookie or 登录状态去获取请求
   */
  const handleLogin = () => {
    const left = (screen.width - 1200) / 2
    const top = (screen.height - 730) / 2
    loginWindowRef.current = window.open(
      `${getClientOrigin()}/login?from=refly-extension-login`,
      "_blank",
      `location=no,toolbar=no,menubar=no,width=800,height=730,left=${left} / 2,top=${top} / 2`,
    )

    userStore.setIsCheckingLoginStatus(true)
  }

  const handleLoginStatus = async ({ body: data }: ExternalLoginPayload) => {
    loginWindowRef.current?.close()

    if (data?.status === "success") {
      const res = await sendToBackground({
        name: "getUserInfo",
      })

      if (!res?.success) throw new Error("登录失败")

      // 临时设置状态
      userStore.setUserProfile(res?.data)
      userStore.setToken(data?.token)

      // 持久化存储
      setToken(data?.token)
      setUserProfile(res?.data)

      navigate("/")
      message.success("登陆成功！")
    } else {
      message.error("登录失败!")
    }

    userStore.setIsCheckingLoginStatus(false)
  }

  useEffect(() => {
    if (bgMessage?.data?.name === "login-notification") {
      handleLoginStatus(bgMessage?.data)
    }
  }, [bgMessage.data])
  // sync storage
  useEffect(() => {
    console.log("loginNotification", loginNotification)
    if (loginNotification) {
      const data = safeParseJSON(loginNotification)
      handleLoginStatus(data)
    }
  }, [loginNotification])

  return (
    <div className="login-container">
      <ChatHeader onlyShowClose />
      <div className="login-brand">
        <div
          className="login-branch-content"
          onClick={() => window.open(getClientOrigin(), "_blank")}>
          <img src={Logo} alt="Refly" style={{ width: 38, height: 38 }} />
          <span
            style={{
              fontSize: 20,
              fontWeight: "bold",
              display: "inline-block",
              marginLeft: 8,
            }}>
            Refly
          </span>
        </div>
        <Button
          type="primary"
          onClick={() => handleLogin()}
          style={{ width: 260, height: 44, marginTop: 32 }}
          loading={userStore.isCheckingLoginStatus}>
          {userStore.isCheckingLoginStatus ? "登录中" : "立即登录"}
        </Button>
      </div>
    </div>
  )
}
