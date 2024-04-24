import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { AppRouter } from "./router/index"
import { AppLayout } from "@/components/layout/index"

// 导入 i18n
import "./i18n/config"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Suspense fallback="loading...">
    <BrowserRouter>
      <AppRouter layout={AppLayout} />
    </BrowserRouter>
  </Suspense>,
)
