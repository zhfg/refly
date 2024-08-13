import { useState } from "react"
import { Avatar, Divider, Layout, Menu, Tag } from "@arco-design/web-react"
import {
  useLocation,
  useNavigate,
} from "@refly-packages/ai-workspace-common/utils/router"
import {
  IconHome,
  IconSettings,
  IconDownload,
  IconTwitter,
  IconLanguage,
  IconImport,
  IconMessage,
  IconMenuFold,
  IconMenuUnfold,
} from "@arco-design/web-react/icon"
// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
// components
import { SearchQuickOpenBtn } from "@refly-packages/ai-workspace-common/components/search-quick-open-btn"
import { useTranslation } from "react-i18next"
import { openGetStartDocument } from "@refly/ai-workspace-common/utils"
import { UILocaleList } from "@refly/ai-workspace-common/components/ui-locale-list"
import { useImportResourceStore } from "@refly/ai-workspace-common/stores/import-resource"

const Sider = Layout.Sider
const MenuItem = Menu.Item

const getNavSelectedKeys = (pathname = "") => {
  if (pathname.includes("digest")) {
    return "Digest"
  } else if (pathname.includes("settings")) {
    return "Settings"
  } else if (pathname.includes("feed")) {
    return "Feed"
  } else if (pathname.includes("thread")) {
    return "ThreadLibrary"
  } else if (pathname.includes("skill")) {
    return "Skill"
  }

  return "Workspace"
}

const SiderLogo = (props: {
  collapse: boolean
  navigate: (path: string) => void
}) => {
  const { navigate, collapse } = props
  return (
    <div
      className="logo-box"
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
      <div className="logo" onClick={() => navigate("/")}>
        <img src={Logo} alt="Refly" />
        {!collapse && (
          <>
            <span>Refly </span>
            <Tag color="#00968F" className="logo-beta" size="small">
              Beta
            </Tag>
          </>
        )}
      </div>
    </div>
  )
}

const CollapseBtn = (props: {
  collapse: boolean
  setCollapse: (collapse: boolean) => void
}) => {
  const { collapse, setCollapse } = props
  return (
    <div
      className={`collapse-btn ${collapse ? "collapse-btn--collapsed" : ""}`}
      onClick={() => setCollapse(!collapse)}>
      {collapse ? (
        <IconMenuUnfold style={{ fontSize: 20, color: "#666666" }} />
      ) : (
        <IconMenuFold style={{ fontSize: 20, color: "#666666" }} />
      )}
    </div>
  )
}

const MenuItemContent = (props: {
  icon?: React.ReactNode
  title: string
  collapse?: boolean
}) => {
  return (
    <div className="flex">
      <div className="flex flex-1 flex-nowrap items-center">
        {props.icon}
        <span className="sider-menu-title">{props.title}</span>
      </div>
    </div>
  )
}

const MenuItemTooltipContent = (props: { title: string }) => {
  return <div>{props.title}</div>
}

const SettingItem = (props: { navigate: (path: string) => void }) => {
  const { navigate } = props
  const userStore = useUserStore()
  return (
    <div className="flex flex-1 items-center justify-between">
      <div
        className="menu-settings"
        onClick={() => {
          navigate("/settings")
        }}>
        <Avatar size={32}>
          <img src={userStore?.userProfile?.avatar || ""} alt="user-avatar" />
        </Avatar>
        <span className="username">{userStore?.userProfile?.name}</span>
      </div>
      <div>
        <span
          className="setting-language-icon"
          style={{ display: "inline-block", marginRight: "8px" }}>
          <UILocaleList>
            <IconLanguage
              style={{
                fontSize: 20,
              }}
            />
          </UILocaleList>
        </span>
        <span
          className="setting-icon"
          onClick={() => {
            navigate("/settings")
          }}>
          <IconSettings style={{ fontSize: 20 }} />
        </span>
      </div>
    </div>
  )
}

// const SiderMenuItem = (props: { icon?: React.ReactNode; title: string }) => {
//   const { icon, title } = props
//   return (
//     <MenuItem
//       className="custom-menu-item"
//       renderItemInTooltip={() => <MenuItemTooltipContent title={title} />}>
//       <MenuItemContent icon={icon} title={title} />
//     </MenuItem>
//   )
// }

export const SiderLayout = () => {
  const [collapse, setCollapse] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStore()
  const importResourceStore = useImportResourceStore()
  const isGuideDetail = location.pathname.includes("guide/")

  const { t } = useTranslation()

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  const notShowLoginBtn = storageUserProfile?.uid || userStore?.userProfile?.uid
  console.log("storageUserProfile", storageUserProfile, userStore?.userProfile)

  const selectedKey = getNavSelectedKeys(location.pathname)
  const handleNavClick = (itemKey: string) => {
    switch (itemKey) {
      case "Workspace": {
        if (!notShowLoginBtn) {
          userStore.setLoginModalVisible(true)
        } else {
          navigate(`/`)
        }
        break
      }

      case "Explore": {
        if (!notShowLoginBtn) {
          userStore.setLoginModalVisible(true)
        } else {
          navigate(`/explore`)
        }
        break
      }

      case "Settings": {
        break
      }

      case "Feed": {
        if (!notShowLoginBtn) {
          userStore.setLoginModalVisible(true)
        } else {
          navigate(`/feed`)
        }
        break
      }

      case "Digest": {
        if (!notShowLoginBtn) {
          userStore.setLoginModalVisible(true)
        } else {
          navigate(`/digest`)
        }
        break
      }

      case "GetHelp": {
        window.open(`https://twitter.com/tuturetom`, "_blank")
        break
      }

      case "Collection": {
        navigate(`/collection`)
        break
      }

      case "Notification": {
        navigate(`/notification`)
        break
      }

      case "Favorites": {
        navigate(`/favorites`)
        break
      }

      case "getStart": {
        openGetStartDocument()
        break
      }

      case "Skill": {
        navigate(`/skill`)
        break
      }

      case "ThreadLibrary": {
        navigate(`/thread`)
        break
      }

      case "DownloadExtension": {
        // 下载浏览器插件
        window.open(
          `https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd`,
          "_blank",
        )
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
    onClick?: () => void
  }
  const siderCenter: SiderCenterProps[] = [
    {
      key: "Workspace",
      name: "homePage",
    },
    {
      key: "Import",
      name: "newResource",
      onClick: () => {
        importResourceStore.setImportResourceModalVisible(true)
      },
    },
    {
      key: "Skill",
      name: "skill",
    },
    {
      key: "ThreadLibrary",
      name: "threadLibrary",
    },
  ]
  return (
    <Sider
      className={`app-sider ${isGuideDetail ? "fixed" : ""}`}
      width={collapse ? 90 : 220}>
      <div
        className={`sider-header ${collapse ? "sider-header-collapse" : ""}`}>
        <SiderLogo navigate={path => navigate(path)} collapse={collapse} />
        <SearchQuickOpenBtn collapse={collapse} />

        <Menu
          style={{
            width: 220,
            backgroundColor: "transparent",
            borderRight: "none",
          }}
          collapse={collapse}
          defaultSelectedKeys={["Workspace"]}
          className="sider-menu-nav"
          selectedKeys={[selectedKey]}
          tooltipProps={{}}
          onClickMenuItem={handleNavClick}>
          <div className="sider-center">
            {siderCenter.map(item => {
              return (
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
                    icon={<IconHome style={{ fontSize: 20 }} />}
                    title={t(`loggedHomePage.siderMenu.${item.name}`)}
                  />
                </MenuItem>
              )
            })}
          </div>

          <div className="sider-footer">
            {!!userStore.userProfile?.uid && (
              <MenuItem
                key="Settings"
                className={`menu-setting-container setting-menu-item ${collapse ? "setting-menu-item-collapse" : ""}`}
                renderItemInTooltip={() => (
                  <MenuItemTooltipContent
                    title={t("loggedHomePage.siderMenu.settings")}
                  />
                )}>
                <SettingItem navigate={path => navigate(path)}></SettingItem>
              </MenuItem>
            )}
            <Divider style={{ margin: "8px 0" }} />
            <MenuItem
              key="GetHelp"
              className="custom-menu-item"
              renderItemInTooltip={() => (
                <MenuItemTooltipContent
                  title={t("loggedHomePage.siderMenu.getHelp")}
                />
              )}>
              <MenuItemContent
                icon={<IconTwitter style={{ fontSize: 20 }} />}
                title={t("loggedHomePage.siderMenu.getHelp")}
              />
            </MenuItem>
            <MenuItem
              key="DownloadExtension"
              className="custom-menu-item"
              renderItemInTooltip={() => (
                <MenuItemTooltipContent
                  title={t("loggedHomePage.siderMenu.download")}
                />
              )}>
              <MenuItemContent
                icon={<IconDownload style={{ fontSize: 20 }} />}
                title={t("loggedHomePage.siderMenu.download")}
              />
            </MenuItem>
          </div>
        </Menu>
        <CollapseBtn
          collapse={collapse}
          setCollapse={() => setCollapse(!collapse)}
        />
      </div>
    </Sider>
  )
}
