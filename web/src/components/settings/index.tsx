import { Button, Modal } from "@arco-design/web-react"
import { useCookie } from "react-use"
import Cookies from "js-cookie"

// styles
import "./index.scss"
import { useUserStore } from "@/stores/user"
import { useNavigate } from "react-router-dom"
import { getClientOrigin, getCookieOrigin, getExtensionId } from "@/utils/url"

export const Settings = () => {
  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid")
  const userStore = useUserStore()
  const navigate = useNavigate()
  const [modal, contextHolder] = Modal.useModal()

  const handleLogout = () => {
    modal.confirm?.({
      title: "退出登录",
      content: "确定退出登录吗？",
      onOk() {
        console.log("delete cookie")
        userStore.setUserProfile(null)
        userStore.setToken("")
        localStorage.removeItem("refly-user-profile")

        // 给插件发消息
        chrome.runtime?.sendMessage(getExtensionId(), {
          name: "logout-notification",
        })

        deleteCookie()
        getClientOrigin
        Cookies.remove("_refly_ai_sid", { domain: getCookieOrigin() })
        navigate("/")
      },
      onConfirm() {},
    })
  }

  return (
    <div className="settings-container">
      <div className="settings-inner-container">
        <div className="settings-title">设置</div>
        <div>
          <Button onClick={() => handleLogout()} style={{ marginTop: 24 }}>
            退出登录
          </Button>
        </div>
      </div>
      {contextHolder}
    </div>
  )
}
