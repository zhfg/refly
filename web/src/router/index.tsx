import React from "react"
import { Route, Routes } from "react-router-dom"

// 自定义组件
import Home from "@/components/home"
import { Thread } from "@/components/thread-item/thread"
import { ThreadLibrary } from "@/components/thread-library"
import { Settings } from "@/components/settings/index"
import Dashboard from "../Dashboard"

export const AppRouter = (props: { layout?: any }) => {
  const { layout: Layout } = props
  // 导航相关

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/thread" element={<ThreadLibrary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  )
}
