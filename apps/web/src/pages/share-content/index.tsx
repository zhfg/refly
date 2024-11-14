import { useEffect, useRef, useState } from "react"
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
import { MessageIntentSource } from "@refly-packages/ai-workspace-common/types/copilot"
import { useShareStoreShallow } from "@refly-packages/ai-workspace-common/stores/share"
import {
  useProjectStore,
  useProjectStoreShallow,
} from "@refly-packages/ai-workspace-common/stores/project"
import { HiOutlineShare } from "react-icons/hi"
import { copyToClipboard } from "@refly-packages/ai-workspace-common/utils"
import { Tooltip } from "@arco-design/web-react"
import { getClientOrigin } from "@refly/utils/url"
import { useContentSelector } from "@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-content-selector"
import { useSelectedMark } from "@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark"
import { useCanvasStoreShallow } from "@refly-packages/ai-workspace-common/stores/canvas"

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
  const canvasList = useShareStoreShallow(state => state.canvasList)
  const setCanvasList = useShareStoreShallow(state => state.setCanvasList)
  const setCurrentCanvasId = useShareStoreShallow(
    state => state.setCurrentCanvasId,
  )
  const { project, setProject } = useProjectStoreShallow(state => ({
    project: state?.project?.data,
    setProject: state.setProject,
  }))
  const canvasStore = useCanvasStoreShallow(state => ({
    updateCurrentCanvas: state.updateCurrentCanvas,
  }))
  const [searchParams, setSearchParams] = useSearchParams()
  const urlCanvasId = searchParams.get("canvasId") as string

  const { shareCode } = useParams()

  const [loading, setLoading] = useState(false)
  const [currentCanvas, setCurrentCanvas] = useState<Canvas>()
  const [breadItems, setBreadItems] = useState<any[]>([])

  const [totalWidth, setTotalWidth] = useState(0)
  const [leftPanelSize, setLeftPanelSize] = useState(800)
  const [copilotSize, setCopilotSize] = useState(400)
  const isCopilotFullScreen = searchParams.get("fullScreen")
  const containerRef = useRef<HTMLDivElement>(null)

  // for content selector
  const baseUrl = getClientOrigin()
  const { initMessageListener, initContentSelectorElem } = useContentSelector(
    "share-canvas-content-container",
    "canvasSelection",
    {
      url: `${baseUrl}/share/${shareCode}`,
    },
  )
  const { handleInitContentSelectorListener } = useSelectedMark()

  const items = [
    {
      label: userProfile?.name,
      key: "login",
    },
  ]

  const getCanvas = async (targetCanvasId?: string) => {
    const { project: projectState } = useProjectStore.getState()

    setLoading(true)
    const { data } = await getClient().getShareContent({
      query: {
        shareCode: shareCode || "",
        ...(targetCanvasId ? { canvasId: targetCanvasId } : {}),
      },
    })
    setLoading(false)

    if (!data?.success) {
      return
    }
    const result = data.data

    setCurrentCanvas(result?.canvas)
    canvasStore.updateCurrentCanvas(result?.canvas as Canvas)
    if (!canvasList?.length) {
      const canvasList =
        result?.canvasList || (result?.canvas ? [result.canvas] : [])
      setCanvasList(canvasList)
    }
    if (!projectState?.data) {
      setProject(result?.project as Project)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      copyToClipboard(text)
      message.success(t("projectDetail.share.copyLinkSuccess"))
    } catch (err) {
      message.error(t("projectDetail.share.copyLinkFailed"))
    }
  }

  const handleCanvasChange = (canvasId: string) => {
    setCurrentCanvasId(canvasId)
    getCanvas(canvasId)
  }

  useEffect(() => {
    if (urlCanvasId) {
      handleCanvasChange(urlCanvasId)
    } else {
      getCanvas()
    }
  }, [shareCode, urlCanvasId]) // 只在 shareCode 变化时重新加载

  useEffect(() => {
    if (project?.title || currentCanvas?.title) {
      setBreadItems([
        {
          title: project?.title,
        },
        {
          title: currentCanvas?.title,
        },
      ])
    }
  }, [currentCanvas?.title, project?.title])

  // 初始化块选择
  useEffect(() => {
    if (loading || !shareCode) {
      return
    }

    const remove = initMessageListener()
    handleInitContentSelectorListener()

    return () => {
      remove()
    }
  }, [loading, shareCode])

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setTotalWidth(containerRef.current.offsetWidth)
      }
    }

    // Initial measurement
    updateWidth()

    // Add resize listener
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (isCopilotFullScreen) {
      requestAnimationFrame(() => {
        setLeftPanelSize(0)
      })
    } else {
      requestAnimationFrame(() => {
        if (totalWidth > 1250) {
          setLeftPanelSize(totalWidth - 400)
        } else {
          setLeftPanelSize(800)
        }
      })
    }
  }, [isCopilotFullScreen, totalWidth])

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
      <div className="share-content flex h-full flex-col" ref={containerRef}>
        <Splitter
          className="share-content-outer-splitter"
          onResize={size => {
            setLeftPanelSize(size[0])
            setCopilotSize(size[1])
          }}>
          <Splitter.Panel
            className="share-main-content-panel"
            size={leftPanelSize}
            min={700}>
            <div className="flex h-full flex-col overflow-hidden bg-[#fcfcf9]">
              <div className="share-header flex items-center justify-between px-6 py-2">
                <div className="flex items-center">
                  <img
                    className="mr-2 h-[20px] w-[20px] cursor-pointer"
                    src={Logo}
                    alt="Refly"
                    onClick={() => {
                      navigate("/")
                    }}
                  />
                  <Breadcrumb items={breadItems} className="text-l" />
                </div>
                <div className="flex items-center">
                  {currentCanvas
                    ? [
                        <Tooltip content={t("projectDetail.share.copyLink")}>
                          <Button
                            type="text"
                            size="small"
                            className="mr-2 text-xs"
                            style={{ color: "#00968F" }}
                            icon={<HiOutlineShare />}
                            onClick={() => {
                              handleCopy(location.href)
                            }}>
                            {t("projectDetail.share.copyLink")}
                          </Button>
                        </Tooltip>,
                      ]
                    : []}
                  {!isLogin ? (
                    <Button
                      type="primary"
                      size="small"
                      className="text-xs"
                      onClick={() => setLoginModalVisible(true)}>
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
              </div>
              <Splitter className="share-content-inner-splitter">
                <Splitter.Panel
                  collapsible
                  defaultSize={300}
                  min={200}
                  max={300}>
                  <div
                    className="border-box relative flex-shrink-0 overflow-y-auto pt-2"
                    style={{ height: "calc(100vh - 56px)" }}>
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
                          setSearchParams(
                            { canvasId: item.canvasId },
                            { replace: true },
                          )
                        }}>
                        {item.title}
                      </div>
                    ))}
                  </div>
                </Splitter.Panel>

                <Splitter.Panel min={450}>
                  <div className="relative flex h-full">
                    <div className="h-full w-full overflow-hidden overflow-y-auto px-12 py-8">
                      <div className="share-canvas-content-container">
                        {loading ? (
                          <Spin />
                        ) : currentCanvas ? (
                          <div className="share-canvas-content mx-auto mb-8 box-border h-full max-w-[1024px] rounded-l">
                            <div className="mb-4 w-full text-2xl font-bold">
                              {currentCanvas?.title}
                            </div>
                            {initContentSelectorElem()}
                            <Markdown content={currentCanvas?.content || ""} />
                          </div>
                        ) : (
                          <Empty description={t("common.empty")} />
                        )}
                      </div>
                    </div>
                  </div>
                </Splitter.Panel>
              </Splitter>
            </div>
          </Splitter.Panel>

          <Splitter.Panel collapsible size={copilotSize} min={400}>
            <AICopilot source={MessageIntentSource.Share} />
          </Splitter.Panel>
        </Splitter>
      </div>
    </ErrorBoundary>
  )
}

export default ShareContent
