/**
 * 此为登录弹框，for web 使用
 */
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
import { Link, useNavigate } from "react-router-dom"
import { safeParseJSON } from "@/utils/parse"

// styles
import "./index.scss"
import { useCookie } from "react-use"
import { getServerOrigin } from "@/utils/url"
import { useTranslation } from "react-i18next"

interface ExternalLoginPayload {
  name: string
  body: {
    status: "success" | "failed"
    token?: string
    user?: User
  }
}

export const LoginModal = (props: { visible?: boolean; from?: string }) => {
  const userStore = useUserStore()
  const navigate = useNavigate()
  const loginWindowRef = useRef<Window | null>()
  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid")

  const { t } = useTranslation()

  /**
   * 0. 获取主站的登录态，如果没有登录就访问 Login 页面，已登录之后再展示可操作页面
   * 1. 打开一个弹窗，访问 Refly 主站进行登录
   * 2. 登录完之后，通过 chrome 的 API 给插件发消息，收到消息之后 reload 页面获取登录状态，然后持久化存储
   * 3. 之后带着 cookie or 登录状态去获取请求
   */
  const handleLogin = () => {
    userStore.setIsCheckingLoginStatus(true)
    location.href = `${getServerOrigin()}/v1/auth/google`

    // userStore.setLoginModalVisible(false)
  }

  // const handleLoginStatus = ({ body: data }: ExternalLoginPayload) => {
  //   if (data?.status === "success") {
  //     // 临时设置状态
  //     userStore.setUserProfile(data?.user)
  //     userStore.setToken(data?.token)

  //     loginWindowRef.current?.close()

  //     navigate("/")
  //   } else {
  //     message.error("登录失败!")

  //     loginWindowRef.current?.close()
  //   }

  //   userStore.setIsCheckingLoginStatus(false)
  // }

  // const handleListenChildPage = (event: any) => {
  //   const data = event?.data || {}
  //   console.log("handleListenChildPage", event)

  //   if (data?.type === "refly-login-status") {
  //     if (data?.status === "success") {
  //       updateCookie(data?.payload || "")
  //       userStore.setLoginModalVisible(false)
  //       userStore.setIsCheckingLoginStatus(false)
  //     }
  //   }
  // }

  // useEffect(() => {
  //   console.log("refly-login-status")
  //   window.addEventListener("message", handleListenChildPage, false)
  // }, [])
  useEffect(() => {
    // 不是插件打开的页面，就直接清除状态，区分插件和普通页面打开
    if (props?.from !== "extension-login") {
      localStorage.removeItem("refly-login-status")
    }
    console.log("props", props)
  }, [])

  // props
  let modalProps: any = {}

  if (props.visible) {
    modalProps = {
      visible: true,
      closable: false,
      maskClosable: false,
      maskStyle: {
        backgroundColor: "#F3F3EE",
        opacity: 1,
      },
    }
  } else {
    modalProps = {
      visible: userStore?.loginModalVisible,
    }
  }

  return (
    <Modal
      {...modalProps}
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
        <div className="login-hint-text">
          {t("landingPage.loginModal.title")}
        </div>
        <Button
          type="primary"
          onClick={() => handleLogin()}
          style={{ width: 260, height: 44, marginTop: 32, borderRadius: 4 }}
          loading={userStore.isCheckingLoginStatus}>
          {userStore.isCheckingLoginStatus
            ? t("landingPage.loginModal.loggingStatus")
            : t("landingPage.loginModal.loginBtn")}
        </Button>
        <Divider></Divider>
        <Typography.Paragraph className="term-text">
          {t("landingPage.loginModal.utilText")}
          <Link
            to="/terms"
            style={{ margin: "0 4px" }}
            onClick={() => {
              userStore.setLoginModalVisible(false)
            }}>
            <Typography.Text underline>
              {t("landingPage.loginModal.terms")}
            </Typography.Text>
          </Link>
          {t("landingPage.loginModal.and")}
          <Link
            to="/privacy"
            style={{ margin: "0 4px" }}
            onClick={() => {
              userStore.setLoginModalVisible(false)
            }}>
            <Typography.Text underline>
              {t("landingPage.loginModal.privacyPolicy")}
            </Typography.Text>
          </Link>
        </Typography.Paragraph>
      </div>
    </Modal>
  )
}
