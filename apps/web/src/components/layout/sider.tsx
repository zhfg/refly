import { useEffect, useState } from "react"
import { Avatar, Divider, Layout, Menu, Tag } from "@arco-design/web-react"
import {
  useLocation,
  useNavigate,
} from "@refly-packages/ai-workspace-common/utils/router"
import { IoLibraryOutline } from "react-icons/io5"

import { IconCanvas } from "@refly-packages/ai-workspace-common/components/common/icon"

// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
// components
import { SearchQuickOpenBtn } from "@refly-packages/ai-workspace-common/components/search-quick-open-btn"
import { useTranslation } from "react-i18next"
import { SiderMenuSettingList } from "@refly-packages/ai-workspace-common/components/sider-menu-setting-list"
// hooks
import { useHandleRecents } from "@refly-packages/ai-workspace-common/hooks/use-handle-rencents"
import { useSiderStoreShallow } from "@refly-packages/ai-workspace-common/stores/sider"

const Sider = Layout.Sider
const MenuItem = Menu.Item

const getNavSelectedKeys = (pathname = "") => {
  if (pathname.includes("settings")) {
    return "Settings"
  } else if (pathname.includes("thread")) {
    return "ThreadLibrary"
  } else if (pathname.includes("skill")) {
    return "Skill"
  } else if (
    pathname.startsWith("/library") ||
    pathname.startsWith("/resource")
  ) {
    return "Library"
  } else if (pathname.startsWith("/project")) {
    return "Project"
  }

  return "Home"
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

const MenuItemContent = (props: {
  icon?: React.ReactNode
  title?: string
  collapse?: boolean
  position?: "left" | "right"
}) => {
  const { position = "left" } = props
  return (
    <div className="flex">
      <div className="flex flex-1 flex-nowrap items-center">
        {position === "left" && props.icon}
        <span className="sider-menu-title">{props.title}</span>
        {position === "right" && props.icon}
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
  const { collapse } = useSiderStoreShallow(state => ({
    collapse: state.collapse,
  }))

  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
    loginModalVisible: state.loginModalVisible,
    setLoginModalVisible: state.setLoginModalVisible,
  }))

  const isGuideDetail = location.pathname.includes("guide/")

  const [currentProjectId, setCurrentProjectId] = useState("")

  const { t } = useTranslation()

  const selectedKey = getNavSelectedKeys(location.pathname)
  const handleNavClick = (itemKey: string) => {
    switch (itemKey) {
      case "CanvasList": {
        console.log("CanvasList")
        break
      }

      case "Settings": {
        break
      }

      case "Library": {
        navigate(`/library`)
        break
      }

      default: {
        break
      }
    }
  }

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
        key: "Library",
        name: "library",
        icon: (
          <IoLibraryOutline className="arco-icon" style={{ fontSize: 20 }} />
        ),
      },
      {
        key: "Canvas",
        name: "canvas",
        icon: <IconCanvas className="arco-icon" style={{ fontSize: 20 }} />,
      },
    ],
  ]

  useHandleRecents(true)

  useEffect(() => {
    const projectId = location.pathname.startsWith("/project/")
      ? location.pathname.split("/")[2]
      : ""

    setCurrentProjectId(projectId)
  }, [location.pathname])

  return (
    <Sider
      className={`app-sider app-sider--${source} ${isGuideDetail ? "fixed" : ""}`}
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
          tooltipProps={{}}
          onClickMenuItem={handleNavClick}>
          <div className="sider-menu-inner">
            {siderSections.map((section, index) => (
              <div key={`section-${index}`} className="sider-section">
                {section.map(item => (
                  <MenuItem
                    key={item.key}
                    className="custom-menu-item"
                    renderItemInTooltip={() => (
                      <MenuItemTooltipContent
                        title={t(`loggedHomePage.siderMenu.${item.name}`)}
                      />
                    )}
                    onClick={item.onClick}>
                    <MenuItemContent
                      icon={item.icon}
                      title={t(`loggedHomePage.siderMenu.${item.name}`)}
                    />
                  </MenuItem>
                ))}

                {index < siderSections.length - 1 && (
                  <Divider style={{ margin: "8px 0 20px 0" }} />
                )}
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
      </div>
    </Sider>
  )
}
