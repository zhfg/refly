import React, { useState } from "react"
import { Button, Divider, Layout, Menu, Tag } from "@arco-design/web-react"
import { Alert, Avatar, Skeleton } from "antd"
import {
  useLocation,
  useNavigate,
} from "@refly-packages/ai-workspace-common/utils/router"

import {
  IconCanvas,
  IconCanvasFill,
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
import { useCreateCanvas } from "@refly-packages/ai-workspace-common/hooks/canvas/use-create-canvas"
// icons
import { IconLibrary } from "@refly-packages/ai-workspace-common/components/common/icon"
import { CanvasActionDropdown } from "@refly-packages/ai-workspace-common/components/workspace/canvas-list-modal/canvasActionDropdown"
import { AiOutlineMenuFold } from "react-icons/ai"

const Sider = Layout.Sider
const MenuItem = Menu.Item
const SubMenu = Menu.SubMenu

const newItemStyle = {
  color: "#00968F",
  fontWeight: "500",
}

const SiderLogo = (props: {
  source: "sider" | "popover"
  navigate: (path: string) => void
  setCollapse: (collapse: boolean) => void
}) => {
  const { navigate, setCollapse, source } = props
  return (
    <div className="logo-box">
      <div className="logo" onClick={() => navigate("/")}>
        <img src={Logo} alt="Refly" />
        <span>Refly </span>
        <Tag color="#00968F" className="logo-beta" size="small">
          Beta
        </Tag>
      </div>
      {source === "sider" && (
        <div>
          <Button
            type="text"
            icon={<AiOutlineMenuFold size={16} className="text-gray-500" />}
            onClick={() => {
              setCollapse(true)
            }}
          />
        </div>
      )}
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
            <Avatar size={32} src={userStore?.userProfile?.avatar} />
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
    canvasList,
    setCollapse,
    setShowLibraryModal,
    setShowCanvasListModal,
    showSettingModal,
    setShowSettingModal,
  } = useSiderStoreShallow(state => ({
    showSettingModal: state.showSettingModal,
    collapse: state.collapse,
    canvasList: state.canvasList,
    setCollapse: state.setCollapse,
    setShowSettingModal: state.setShowSettingModal,
    setShowLibraryModal: state.setShowLibraryModal,
    setShowCanvasListModal: state.setShowCanvasListModal,
  }))

  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
  }))

  const { isLoadingCanvas } = useHandleSiderData(true)
  const { debouncedCreateCanvas, isCreating: createCanvasLoading } =
    useCreateCanvas()

  const { t } = useTranslation()

  const [showCanvasIdActionDropdown, setShowCanvasIdActionDropdown] = useState<
    string | null
  >(null)

  const MenuItemContent = (props: {
    icon?: React.ReactNode
    title?: string
    type: string
    collapse?: boolean
    position?: "left" | "right"
  }) => {
    const { position = "left", type } = props

    const handleNavClick = (e: React.MouseEvent) => {
      if (type === "Canvas") {
        setShowCanvasListModal(true)
      } else if (type === "Library") {
        setShowLibraryModal(true)
      }
    }
    return (
      <div
        className="relative flex"
        style={{
          zIndex: 2,
        }}
        onClick={e => {
          handleNavClick(e)
        }}>
        <div className="flex flex-1 flex-nowrap items-center">
          {position === "left" && props.icon}
          <span className="sider-menu-title">{props.title}</span>
          {position === "right" && props.icon}
        </div>
      </div>
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
        icon: (
          <IconCanvas
            key="canvas"
            className="arco-icon"
            style={{ fontSize: 20 }}
          />
        ),
      },
      {
        key: "Library",
        name: "library",
        icon: (
          <IconLibrary
            key="library"
            className="arco-icon"
            style={{ fontSize: 20 }}
          />
        ),
      },
    ],
  ]

  return (
    <Sider
      className={`app-sider app-sider--${source}`}
      width={source === "sider" ? (collapse ? 0 : 220) : 220}>
      <div className="sider-header">
        <SiderLogo
          source={source}
          navigate={path => navigate(path)}
          setCollapse={setCollapse}
        />

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
          openKeys={["Canvas", "Library"]}>
          <div className="sider-menu-inner">
            {siderSections.map((section, index) => (
              <div key={`section-${index}`} className="sider-section">
                {section.map((item, itemIndex) => (
                  <React.Fragment key={item.key}>
                    <SubMenu
                      className="customer-submenu"
                      key={item.key}
                      title={
                        <MenuItemContent
                          type={item.key}
                          icon={item.icon}
                          title={t(`loggedHomePage.siderMenu.${item.name}`)}
                        />
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

                          {isLoadingCanvas ? (
                            <>
                              <Skeleton.Input
                                key="skeleton-1"
                                active
                                size="small"
                                style={{ width: 204 }}
                              />
                              <Skeleton.Input
                                key="skeleton-2"
                                active
                                size="small"
                                style={{ marginTop: 8, width: 204 }}
                              />
                              <Skeleton.Input
                                key="skeleton-3"
                                active
                                size="small"
                                style={{ marginTop: 8, width: 204 }}
                              />
                            </>
                          ) : (
                            canvasList.map(canvas => (
                              <MenuItem
                                key={canvas.id}
                                className="group relative"
                                onClick={e => {
                                  const isClickMenu = (
                                    e.target as HTMLElement
                                  )?.closest(".arco-menu-item-inner")
                                  if (
                                    isClickMenu &&
                                    canvas.id !== selectedKey
                                  ) {
                                    navigate(`/canvas/${canvas.id}`)
                                  }
                                }}>
                                <div className="flex items-center">
                                  <IconCanvasFill className="arco-icon" />
                                  <div className="w-32 flex-1 truncate">
                                    {canvas?.name ?? ""}
                                  </div>
                                  <div
                                    className={`flex items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                                      showCanvasIdActionDropdown === canvas.id
                                        ? "opacity-100"
                                        : ""
                                    }`}>
                                    <CanvasActionDropdown
                                      canvasId={canvas.id}
                                      canvasName={canvas.name}
                                      updateShowStatus={canvasId => {
                                        setShowCanvasIdActionDropdown(canvasId)
                                      }}
                                    />
                                  </div>
                                </div>
                              </MenuItem>
                            ))
                          )}
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
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>

          <div className="sider-footer">
            <Alert
              message={
                <div className="flex cursor-pointer items-center justify-center">
                  <a
                    href="https://powerformer.feishu.cn/wiki/Syrsw7DJxiaExSkoSiXcTF1inBg?from=canvas"
                    target="_blank">
                    👉{"    "}
                    <span>{t("loggedHomePage.siderMenu.joinFeedback")}</span>
                  </a>
                </div>
              }
              type="success"
              closable
              style={{ marginBottom: 8 }}
            />
            {!!userStore.userProfile?.uid && (
              <MenuItem
                key="Settings"
                style={{ height: 48 }}
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
