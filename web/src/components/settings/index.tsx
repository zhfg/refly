import { Button, Modal } from "@arco-design/web-react"
import { useCookie } from "react-use"

// styles
import "./index.scss"
import { useUserStore } from "@/stores/user"
import { useNavigate } from "react-router-dom"

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
        deleteCookie()
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
