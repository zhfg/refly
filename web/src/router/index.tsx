import React, { useEffect } from "react"
import { useNavigate, Route, Routes } from "react-router-dom"
// stores
import { useUserStore } from "@/stores/user"

// 自定义组件
import Home from "@/components/home"
import { Thread } from "@/components/thread-item/thread"
import { ThreadLibrary } from "@/components/thread-library"
import { Login } from "@/components/login"

// request
import getUserInfo from "@/requests/getUserInfo"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  // 导航相关
  const userStore = useUserStore()

  const getLoginStatus = async () => {
    try {
      const res = await getUserInfo()

      console.log("loginStatus", res)

      if (!res?.success) {
        userStore.setUserProfile(undefined)
        userStore.setToken("")
      } else {
        userStore.setUserProfile(res?.data)
      }
    } catch (err) {
      console.log("getLoginStatus err", err)
      userStore.setUserProfile(undefined)
      userStore.setToken("")
    }
  }

  useEffect(() => {
    getLoginStatus()
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/thread" element={<ThreadLibrary />} />
      </Routes>
    </Layout>
  )
}
