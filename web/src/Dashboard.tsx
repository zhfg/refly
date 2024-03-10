import { useState, useEffect } from "react"
import { useCookie } from "react-use"
import { useNavigate } from "react-router-dom"

// stores
import type { User } from "./types"

export const extensionId = "fcncfleeddfdpbigljgiejfdkmpkldpe"

function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({})
  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid")

  const handleSendMsgToExtension = async (
    status: "success" | "failed",
    token?: string,
  ) => {
    try {
      await chrome.runtime.sendMessage(extensionId, {
        name: "login-notification",
        body: {
          status,
          token,
        },
      })
    } catch (err) {
      console.log("handleSendMsgToExtension err", err)
    }

    setTimeout(() => {
      window.close()
    }, 2000)
  }

  useEffect(() => {
    if (!token) return
    if (token) {
      // 从插件打开弹窗，给插件发消息
      handleSendMsgToExtension("success", token)

      // 从 Web 打开弹窗，给 opener 发消息
      // window?.opener?.postMessage({
      //   type: "refly-login-status",
      //   status: "success",
      //   payload: token,
      // })

      // window.close()
    }
  }, [token])

  return <></>
}

export default Dashboard
