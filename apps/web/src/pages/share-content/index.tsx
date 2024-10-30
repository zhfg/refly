import { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import { ErrorBoundary } from "@sentry/react"
import { useSearchParams } from "@refly-packages/ai-workspace-common/utils/router"
import { useParams } from "@refly-packages/ai-workspace-common/utils/router"
import { useNavigate } from "react-router-dom"

import "./index.scss"
import Logo from "@/assets/logo.svg"

import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import {
  Avatar,
  Dropdown,
  message,
  Breadcrumb,
  Spin,
  Empty,
  Button,
  Splitter,
} from "antd"
import { FaRegUser } from "react-icons/fa"
import { Markdown } from "@refly-packages/ai-workspace-common/components/markdown"
import { Project, Canvas } from "@refly/openapi-schema"
import getClient from "@refly-packages/ai-workspace-common/requests/proxiedRequest"
import { AICopilot } from "@refly-packages/ai-workspace-common/components/copilot"

const ShareContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { userProfile, isLogin, setLoginModalVisible } = useUserStoreShallow(
    state => ({
      userProfile: state.userProfile,
      isLogin: state.isLogin,
      setLoginModalVisible: state.setLoginModalVisible,
    }),
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const canvasId = searchParams.get("canvasId") as string

  const { shareCode } = useParams()

  const [loading, setLoading] = useState(false)
  const [canvasList, setCanvasList] = useState<Canvas[]>([])
  const [currentCanvasId, setCurrentCanvasId] = useState<string>(canvasId)
  const [currentCanvas, setCurrentCanvas] = useState<Canvas>()
  const [project, setProject] = useState<Project>()
  const [breadItems, setBreadItems] = useState<any[]>([])

  const items = [
    {
      label: userProfile?.name,
      key: "login",
    },
  ]

  const getCanvas = async () => {
    setLoading(true)
    const { data } = await getClient().getShareContent({
      query: {
        shareCode: shareCode || "",
        ...(currentCanvasId && { canvasId: currentCanvasId }),
      },
    })
    if (!data?.success) {
      message.error(data?.errMsg)
      setLoading(false)
      return
    }
    const result = data.data

    setCurrentCanvas(result?.canvas)
    if (!canvasList?.length) {
      setCanvasList(result?.canvasList || [])
    }
    if (!project) {
      setProject(result?.project)
    }
    setLoading(false)
  }

  useEffect(() => {
    getCanvas()
  }, [currentCanvasId])

  useEffect(() => {
    setBreadItems([
      {
        title: project?.title,
      },
      {
        title: currentCanvas?.title,
      },
    ])
  }, [currentCanvas?.title, project?.title])

  useEffect(() => {
    if (currentCanvasId && canvasId !== currentCanvasId) {
      setSearchParams({
        canvasId: currentCanvasId,
      })
    }
  }, [canvasId, currentCanvasId])

  const title = project
    ? `${project.title} · ${currentCanvas?.title}`
    : currentCanvas?.title

  return (
    <ErrorBoundary>
      <Helmet>
        <title>
          {title || t("shareContent.title")} · {t("productName")}
        </title>
      </Helmet>
      <div className="share-content flex h-full flex-col">
        <div className="share-header flex items-center justify-between pb-2 pl-6 pr-6 pt-2">
          <div className="flex items-center">
            <img
              className="mr-2 h-[32px] w-[32px] cursor-pointer"
              src={Logo}
              alt="Refly"
              onClick={() => {
                navigate("/")
              }}
            />
            <Breadcrumb items={breadItems} className="text-l" />
          </div>
          {!isLogin ? (
            <Button type="primary" onClick={() => setLoginModalVisible(true)}>
              {t("shareContent.login")}
            </Button>
          ) : (
            <Dropdown menu={{ items }}>
              <Avatar
                src={userProfile?.avatar}
                icon={isLogin ? null : <FaRegUser />}
                className="cursor-pointer border-2 hover:border-[#00968F]"
              />
            </Dropdown>
          )}
        </div>

        <div className="canvas-content relative flex-grow overflow-hidden">
          <Splitter>
            <Splitter.Panel>
              <div className="left-panel relative flex h-full w-full">
                {canvasList.length > 0 && (
                  <div className="shadow-l w-[20%] flex-shrink-0 overflow-y-auto pt-2">
                    {canvasList.map((item: Canvas) => (
                      <div
                        key={item.canvasId}
                        className="mb-1 ml-4 mr-4 mt-1 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-md p-2 text-[14px] hover:bg-gray-100"
                        style={{
                          backgroundColor:
                            currentCanvas?.canvasId === item.canvasId
                              ? "rgba(0,0,0,0.05)"
                              : "",
                        }}
                        onClick={() => {
                          setCurrentCanvasId(item.canvasId)
                        }}>
                        {item.title}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-grow overflow-hidden bg-[#f5f5f5] p-8">
                  {loading ? (
                    <Spin
                      className="flex h-full w-full items-center justify-center"
                      size="large"
                    />
                  ) : (
                    <>
                      {currentCanvas ? (
                        <div className="share-canvas-content mx-auto mb-8 box-border h-full max-w-[1024px] overflow-y-auto rounded-lg bg-white p-8 shadow-lg">
                          <div className="mb-4 w-full text-center text-2xl font-bold">
                            {currentCanvas?.title}
                          </div>
                          <Markdown content={currentCanvas?.content || ""} />
                        </div>
                      ) : (
                        <Empty />
                      )}
                    </>
                  )}
                </div>
              </div>
            </Splitter.Panel>

            <Splitter.Panel collapsible defaultSize={400} max={500} min={400}>
              <AICopilot />
            </Splitter.Panel>
          </Splitter>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ShareContent
