import {
  Button,
  Message as message,
  Modal,
  Divider,
  Typography,
} from "@arco-design/web-react"
import React, { useEffect, useRef, useState } from "react"

// stores
import { useUserStore } from "@/stores/user"
// storage

// 静态资源
import Logo from "@/assets/logo.svg"
import type { User } from "@/types"
import { useNavigate } from "react-router-dom"
import { safeParseJSON } from "@/utils/parse"

// styles
import "./index.scss"
import { useCookie } from "react-use"

interface ExternalLoginPayload {
  name: string
  body: {
    status: "success" | "failed"
    token?: string
    user?: User
  }
}

export const LoginModal = () => {
  const userStore = useUserStore()
  const navigate = useNavigate()
  const loginWindowRef = useRef<Window | null>()
  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid")

  /**
   * 0. 获取主站的登录态，如果没有登录就访问 Login 页面，已登录之后再展示可操作页面
   * 1. 打开一个弹窗，访问 Refly 主站进行登录
   * 2. 登录完之后，通过 chrome 的 API 给插件发消息，收到消息之后 reload 页面获取登录状态，然后持久化存储
   * 3. 之后带着 cookie or 登录状态去获取请求
   */
  const handleLogin = () => {
    const left = (screen.width - 800) / 2
    const top = (screen.height - 730) / 2

    loginWindowRef.current = window.open(
      "http://localhost:3000/v1/auth/google",
      "_blank",
      `location=no,toolbar=no,menubar=no,width=800,height=730,left=${left} / 2,top=${top} / 2`,
    )

    // userStore.setLoginModalVisible(false)
  }

  const handleLoginStatus = ({ body: data }: ExternalLoginPayload) => {
    if (data?.status === "success") {
      // 临时设置状态
      userStore.setUserProfile(data?.user)
      userStore.setToken(data?.token)

      loginWindowRef.current?.close()

      navigate("/")
    } else {
      message.error("登录失败!")

      loginWindowRef.current?.close()
    }

    userStore.setIsCheckingLoginStatus(false)
  }

  const handleListenChildPage = (event: any) => {
    const data = event?.data || {}
    console.log("handleListenChildPage", event)

    if (data?.type === "refly-login-status") {
      if (data?.status === "success") {
        updateCookie(data?.payload || "")
        userStore.setLoginModalVisible(false)
        userStore.setIsCheckingLoginStatus(false)
      }
    }
  }

  useEffect(() => {
    console.log("refly-login-status")
    window.addEventListener("message", handleListenChildPage, false)
  }, [])

  return (
    <Modal
      visible={userStore?.loginModalVisible}
      footer={null}
      className="login-modal"
      wrapStyle={{
        borderRadius: 8,
      }}
      onCancel={() => userStore.setLoginModalVisible(false)}>
      <div className="login-container">
        <div className="login-brand">
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
        <div className="login-hint-text">登录或注册以继续使用 Refly </div>
        <Button
          type="primary"
          onClick={() => handleLogin()}
          style={{ width: 260, height: 44, marginTop: 32, borderRadius: 4 }}
          loading={userStore.isCheckingLoginStatus}>
          {userStore.isCheckingLoginStatus ? "登录中" : "立即登录"}
        </Button>
        <Divider></Divider>
        <Typography.Paragraph className="term-text">
          注册同意即表明您同意
          <Typography.Text underline>条款和条件</Typography.Text>及
          <Typography.Text underline>隐私政策</Typography.Text>
        </Typography.Paragraph>
      </div>
    </Modal>
  )
}
