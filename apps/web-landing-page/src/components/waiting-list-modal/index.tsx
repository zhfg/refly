/**
 * 此为登录弹框，for web 使用
 */
import {
  Button,
  Message as message,
  Modal,
  Divider,
  Typography,
  Spin,
} from "@arco-design/web-react"
import React, { useEffect, useRef, useState } from "react"

// stores
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
// storage

// 静态资源
import Logo from "@/assets/logo.svg"
import {
  Link,
  useNavigate,
} from "@refly-packages/ai-workspace-common/utils/router"

// styles
import "./index.scss"
import { useCookie } from "react-use"
import { getServerOrigin } from "@refly/utils/url"
import { useTranslation } from "react-i18next"
import { Helmet } from "react-helmet"

export const WaitingListModal = (props: {
  visible?: boolean
  from?: string
}) => {
  const userStore = useUserStore()
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<number>()
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

    // userStore.setWaitingListModalVisible(false)
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
  //       userStore.setWaitingListModalVisible(false)
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

    return () => {
      //   document.querySelector("#getwaitlist-js")?.remove()
      //   document.querySelector("#getwaitlist-css")?.remove()
    }
  }, [])

  useEffect(() => {
    if (userStore.waitingListModalVisible && loading) {
      timerRef.current = setTimeout(() => {
        setLoading(false)
      }, 2000)
    }

    return () => {
      clearTimeout(timerRef.current)
    }
  }, [userStore?.waitingListModalVisible, loading])

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
      visible: userStore?.waitingListModalVisible,
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
      style={{ width: "60%", background: "#fcfcf9", minHeight: 407 }}
      onCancel={() => userStore.setWaitingListModalVisible(false)}>
      <Spin loading={loading} tip="加载中，请稍后..." style={{ width: "100%" }}>
        <div className="login-container" style={{ minHeight: 407 }}>
          <div
            id="getWaitlistContainer"
            className="flex justify-center align-middle"
            data-waitlist_id="18614"
            data-widget_type="WIDGET_1"></div>
          <Helmet>
            <link
              rel="stylesheet"
              type="text/css"
              id="getwaitlist-css"
              href="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css"
            />
            <script
              id="getwaitlist-js"
              src="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js"></script>
          </Helmet>
        </div>
      </Spin>
    </Modal>
  )
}
