import { useState } from "react"
import {
  Avatar,
  Button,
  Divider,
  Layout,
  Menu,
  Tag,
} from "@arco-design/web-react"
import { Tooltip, message } from "antd"
import {
  useLocation,
  useNavigate,
  useParams,
} from "@refly-packages/ai-workspace-common/utils/router"
import { IoLibraryOutline } from "react-icons/io5"

import {
  IconCanvas,
  IconCanvasFill,
  IconDocument,
  IconResource,
  IconPlus,
} from "@refly-packages/ai-workspace-common/components/common/icon"

// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
// components
import { SearchQuickOpenBtn } from "@refly-packages/ai-workspace-common/components/search-quick-open-btn"
import { useTranslation } from "react-i18next"
import { SiderMenuSettingList } from "@refly-packages/ai-workspace-common/components/sider-menu-setting-list"
import { SettingModal } from "@refly-packages/ai-workspace-common/components/settings"
// hooks
import { useHandleSiderData } from "@refly-packages/ai-workspace-common/hooks/use-handle-sider-data"
import { useSiderStoreShallow } from "@refly-packages/ai-workspace-common/stores/sider"
import getClient from "@refly-packages/ai-workspace-common/requests/proxiedRequest"
import { useDebouncedCallback } from "use-debounce"
import { useCreateCanvas } from "@refly-packages/ai-workspace-common/hooks/use-create-canvas"
import { useCanvasNodesStore } from "@refly-packages/ai-workspace-common/stores/canvas-nodes"
import { CanvasNodeType } from "@refly-packages/ai-workspace-common/requests/types.gen"

const Sider = Layout.Sider
const MenuItem = Menu.Item
const SubMenu = Menu.SubMenu

const newItemStyle = {
  color: "#00968F",
  fontWeight: "500",
}

const SiderLogo = (props: { navigate: (path: string) => void }) => {
  const { navigate } = props
  return (
    <div className="logo-box">
      <div className="logo" onClick={() => navigate("/")}>
        <img src={Logo} alt="Refly" />
        <span>Refly </span>
        <Tag color="#00968F" className="logo-beta" size="small">
          Beta
        </Tag>
      </div>
    </div>
  )
}

const MenuItemTooltipContent = (props: { title: string }) => {
  return <div>{props.title}</div>
}

const SettingItem = () => {
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
  }))
  const { t } = useTranslation()
  return (
    <div className="w-full">
      <SiderMenuSettingList>
        <div className="flex flex-1 items-center justify-between">
          <div className="menu-settings user-profile">
            <Avatar size={32}>
              <img
                src={userStore?.userProfile?.avatar || ""}
                alt="user-avatar"
              />
            </Avatar>
            <span className="username">
              <span>{userStore?.userProfile?.nickname}</span>
            </span>
          </div>

          <div className="subscription-status">
            {t(
              `settings.subscription.subscriptionStatus.${userStore?.userProfile?.subscription?.planType || "free"}`,
            )}
          </div>
        </div>
      </SiderMenuSettingList>
    </div>
  )
}

export const SiderLayout = (props: { source: "sider" | "popover" }) => {
  const { source = "sider" } = props
  const {
    collapse,
    libraryList,
    canvasList,
    setShowLibraryModal,
    setShowCanvasListModal,
    showSettingModal,
    setShowSettingModal,
  } = useSiderStoreShallow(state => ({
    showSettingModal: state.showSettingModal,
    collapse: state.collapse,
    libraryList: state.libraryList,
    canvasList: state.canvasList,
    setShowSettingModal: state.setShowSettingModal,
    setShowLibraryModal: state.setShowLibraryModal,
    setShowCanvasListModal: state.setShowCanvasListModal,
  }))

  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
    loginModalVisible: state.loginModalVisible,
    setLoginModalVisible: state.setLoginModalVisible,
  }))

  const { getLibraryList } = useHandleSiderData(true)
  const { debouncedCreateCanvas, isCreating: createCanvasLoading } =
    useCreateCanvas()

  const { canvasId = "" } = useParams()

  const { t } = useTranslation()

  const { setPendingNode } = useCanvasNodesStore()

  const MenuItemContent = (props: {
    icon?: React.ReactNode
    title?: string
    type: string
    collapse?: boolean
    position?: "left" | "right"
  }) => {
    const { position = "left", type } = props

    const handleNavClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (type === "Canvas") {
        setShowCanvasListModal(true)
      } else if (type === "Library") {
        setShowLibraryModal(true)
      }
    }
    return (
      <>
        <Tooltip title={t(`loggedHomePage.siderMenu.viewMore`)}>
          <div
            className="flex"
            onClick={e => {
              handleNavClick(e)
            }}>
            <div className="flex flex-1 flex-nowrap items-center">
              {position === "left" && props.icon}
              <span className="sider-menu-title">{props.title}</span>
              {position === "right" && props.icon}
            </div>
          </div>
        </Tooltip>
      </>
    )
  }

  const getNavSelectedKeys = () => {
    const pathname = location.pathname
    if (pathname.startsWith("/canvas")) {
      const arr = pathname?.split("?")[0]?.split("/")
      const canvasId = arr[arr.length - 1]
      return canvasId
    }

    return "Home"
  }

  const selectedKey = getNavSelectedKeys()

  interface SiderCenterProps {
    key: string
    name: string
    icon: React.ReactNode
    showDivider?: boolean
    onClick?: () => void
  }

  const siderSections: SiderCenterProps[][] = [
    [],
    [
      {
        key: "Canvas",
        name: "canvas",
        icon: <IconCanvas className="arco-icon" style={{ fontSize: 20 }} />,
      },
      {
        key: "Library",
        name: "library",
        icon: (
          <IoLibraryOutline className="arco-icon" style={{ fontSize: 20 }} />
        ),
      },
    ],
  ]

  const [createDocumentLoading, setCreateDocumentLoading] = useState(false)

  const getCurrentCanvasId = () => {
    const pathname = location.pathname
    if (pathname.startsWith("/canvas")) {
      const arr = pathname?.split("?")[0]?.split("/")
      return arr[arr.length - 1]
    }
    return null
  }

  const handleNewDocument = useDebouncedCallback(async () => {
    if (createDocumentLoading) return
    setCreateDocumentLoading(true)

    try {
      const { data } = await getClient().createDocument({
        body: {
          title: `Document-${new Date().toISOString()}`,
          initialContent: "# Document\n\n hello world",
        },
      })

      if (data?.success) {
        message.success(t("common.putSuccess"))
        await getLibraryList()

        const currentCanvasId = getCurrentCanvasId()

        if (currentCanvasId && currentCanvasId !== "empty") {
          const newNode = {
            type: "document" as CanvasNodeType,
            data: {
              title: data.data?.title || "",
              entityId: data.data?.docId || "",
              metadata: {
                contentPreview: data.data?.contentPreview || "",
              },
            },
            position: { x: 100, y: 100 },
          }

          setPendingNode(newNode)
        }
      }
    } catch (error) {
      console.error("Error creating document:", error)
      message.error(t("common.error"))
    } finally {
      setCreateDocumentLoading(false)
    }
  }, 300)

  return (
    <Sider
      className={`app-sider app-sider--${source}`}
      width={source === "sider" ? (collapse ? 0 : 220) : 220}>
      <div className="sider-header">
        <SiderLogo navigate={path => navigate(path)} />

        <SearchQuickOpenBtn />

        <Menu
          style={{
            width: 220,
            backgroundColor: "transparent",
            borderRight: "none",
          }}
          defaultSelectedKeys={["Home"]}
          className="sider-menu-nav"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["Canvas", "Library"]}>
          <div className="sider-menu-inner">
            {siderSections.map((section, index) => (
              <div key={`section-${index}`} className="sider-section">
                {section.map((item, itemIndex) => (
                  <>
                    <SubMenu
                      key={item.key}
                      title={
                        <>
                          <MenuItemContent
                            type={item.key}
                            icon={item.icon}
                            title={t(`loggedHomePage.siderMenu.${item.name}`)}
                          />
                        </>
                      }>
                      {item.key === "Canvas" && (
                        <>
                          <MenuItem
                            key="newCanvas"
                            onClick={debouncedCreateCanvas}>
                            <Button
                              loading={createCanvasLoading}
                              type="text"
                              icon={
                                <IconPlus className="arco-icon !text-[#00968F]" />
                              }
                              style={newItemStyle}
                            />

                            <span style={newItemStyle}>
                              {t("loggedHomePage.siderMenu.newCanvas")}
                            </span>
                          </MenuItem>

                          {canvasList.map(canvas => (
                            <MenuItem
                              key={canvas.id}
                              onClick={() => {
                                if (canvas.id !== selectedKey)
                                  navigate(`/canvas/${canvas.id}`)
                              }}>
                              <IconCanvasFill className="arco-icon" />
                              {canvas.name}
                            </MenuItem>
                          ))}
                        </>
                      )}

                      {item.key === "Library" && (
                        <>
                          <MenuItem
                            key="newDocument"
                            onClick={handleNewDocument}>
                            <Button
                              loading={createDocumentLoading}
                              type="text"
                              icon={
                                <IconPlus className="arco-icon !text-[#00968F]" />
                              }
                              style={newItemStyle}
                            />

                            <span style={newItemStyle}>
                              {t("loggedHomePage.siderMenu.newDocument")}
                            </span>
                          </MenuItem>

                          {libraryList.map(library => (
                            <MenuItem key={library.id}>
                              {library.type === "document" && (
                                <IconDocument className="arco-icon" />
                              )}
                              {library.type === "resource" && (
                                <IconResource className="arco-icon" />
                              )}
                              {library.name}
                            </MenuItem>
                          ))}
                        </>
                      )}
                    </SubMenu>
                    {itemIndex < siderSections.length - 1 && (
                      <Divider
                        key={`divider-${itemIndex}`}
                        style={{
                          margin: "8px 0",
                          borderBottom: "1px dashed #e8e8e8",
                        }}
                      />
                    )}
                  </>
                ))}
              </div>
            ))}
          </div>

          <div className="sider-footer">
            {!!userStore.userProfile?.uid && (
              <MenuItem
                key="Settings"
                style={{ height: 40 }}
                className={`menu-setting-container setting-menu-item`}
                renderItemInTooltip={() => (
                  <MenuItemTooltipContent
                    title={t("loggedHomePage.siderMenu.settings")}
                  />
                )}>
                <SettingItem></SettingItem>
              </MenuItem>
            )}
          </div>
        </Menu>

        <SettingModal
          visible={showSettingModal}
          setVisible={setShowSettingModal}
        />
      </div>
    </Sider>
  )
}
