import React, { Suspense, useEffect, lazy } from "react"
import { ConfigProvider } from "antd"
import ReactDOM from "react-dom/client"
import {
  createBrowserRouter,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
  RouterProvider,
  Outlet,
} from "react-router-dom"

// Import AppRouter lazily
const AppRouter = lazy(() =>
  import("./routes/index").then(module => ({ default: module.AppRouter })),
)
// Import AppLayout lazily
const AppLayout = lazy(() =>
  import("@/components/layout/index").then(module => ({
    default: module.AppLayout,
  })),
)

import "@refly-packages/ai-workspace-common/i18n/config"
import {
  getEnv,
  setRuntime,
} from "@refly-packages/ai-workspace-common/utils/env"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import { SuspenseLoading } from "@refly-packages/ai-workspace-common/components/common/loading"

// styles
import "@/styles/style.css"

setRuntime("web")

// Move Sentry initialization to a separate function
const initSentry = async () => {
  if (process.env.NODE_ENV !== "development") {
    const Sentry = await import("@sentry/react")
    Sentry.init({
      dsn: "https://a687291d5ba3a77b0fa559e6d197eac8@o4507205453414400.ingest.us.sentry.io/4507208398602240",
      environment: getEnv(),
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect: React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost", "https://app.refly.ai"],
      // Session Replay
      replaysSessionSampleRate: 0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    })
  }
}

// Call Sentry initialization
initSentry()

// Update App component to remove Suspense (moved to router definition)
export const App = () => {
  const userStore = useUserStoreShallow(state => ({
    setRuntime: state.setRuntime,
  }))

  useEffect(() => {
    setRuntime("web")
    userStore.setRuntime("web")
  }, [])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00968F",
          borderRadius: 6,
        },
      }}>
      <Outlet />
    </ConfigProvider>
  )
}

// Update router creation to use createBrowserRouter with proper route definitions
const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
    children: [
      {
        path: "*",
        async loader() {
          await Promise.all([
            import("./routes/index"),
            import("@/components/layout/index"),
          ])
          return null
        },
        element: (
          <Suspense fallback={<SuspenseLoading />}>
            <AppRouter layout={AppLayout} />
          </Suspense>
        ),
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
)
