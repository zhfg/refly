import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { AppRouter } from "./router/index"
import { AppLayout } from "@/components/layout/index"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRouter layout={AppLayout} />
    </BrowserRouter>
  </React.StrictMode>,
)
