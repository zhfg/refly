import { useState } from "react"
import {
  Avatar,
  Divider,
  Layout,
  Menu,
  Tag,
  Tooltip,
} from "@arco-design/web-react"
import {
  useLocation,
  useNavigate,
} from "@refly-packages/ai-workspace-common/utils/router"
import { HiOutlineHome } from "react-icons/hi2"
import { LuDownload } from "react-icons/lu"
import { RiRobot2Line, RiHistoryLine } from "react-icons/ri"
import {
  AiOutlineTwitter,
  AiOutlineMenuFold,
  AiOutlineMenuUnfold,
} from "react-icons/ai"
import { IconLanguage, IconImport } from "@arco-design/web-react/icon"
// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
// components
import { SearchQuickOpenBtn } from "@refly-packages/ai-workspace-common/components/search-quick-open-btn"
import { useTranslation } from "react-i18next"
import { openGetStartDocument } from "@refly-packages/ai-workspace-common/utils"
import { UILocaleList } from "@refly-packages/ai-workspace-common/components/ui-locale-list"
import { useImportResourceStore } from "@refly-packages/ai-workspace-common/stores/import-resource"
import { useKnowledgeBaseStore } from "@refly-packages/ai-workspace-common/stores/knowledge-base"
import { SiderMenuSettingList } from "@refly-packages/ai-workspace-common/components/sider-menu-setting-list"

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
  setCollapse: (collapse: boolean) => void
}) => {
  const { navigate, collapse, setCollapse } = props
  return (
    <div className="logo-box">
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
      {!collapse && (
        <div className="collapse-btn" onClick={() => setCollapse(true)}>
          <Tooltip position="right" content="Collapse">
            <AiOutlineMenuFold
              className="arco-icon"
              style={{ fontSize: 20, color: "#666666" }}
            />
          </Tooltip>
        </div>
      )}
    </div>
  )
}

const MenuItemContent = (props: {
  icon?: React.ReactNode
  title?: string
  collapse?: boolean
}) => {
  return (
    <div className="flex">
      <div className="flex flex-nowrap flex-1 items-center">
        {props.icon}
        <span className="sider-menu-title">{props.title}</span>
      </div>
    </div>
  )
}

const MenuItemTooltipContent = (props: { title: string }) => {
  return <div>{props.title}</div>
}

const SettingItem = () => {
  const userStore = useUserStore()
  return (
    <div className="flex flex-1 justify-between items-center">
      <SiderMenuSettingList>
        <div className="menu-settings user-profile">
          <Avatar size={32}>
            <img src={userStore?.userProfile?.avatar || ""} alt="user-avatar" />
          </Avatar>
          <span className="username">
            <span>{userStore?.userProfile?.nickname}</span>
          </span>
        </div>
      </SiderMenuSettingList>

      <div>
        <span
          className="setting-language-icon"
          style={{ display: "inline-block" }}>
          <UILocaleList>
            <IconLanguage style={{ fontSize: 20 }} />
          </UILocaleList>
        </span>
      </div>
    </div>
  )
}

export const SiderLayout = () => {
  const [collapse, setCollapse] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStore()
  const importResourceStore = useImportResourceStore(state => ({
    setImportResourceModalVisible: state.setImportResourceModalVisible,
    setSelectedMenuItem: state.setSelectedMenuItem,
  }))
  const isGuideDetail = location.pathname.includes("guide/")
  const { resourcePanelVisible } = useKnowledgeBaseStore()

  console.log(
    "useKnowledgeBaseStore state update from app web",
    resourcePanelVisible,
  )

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

      case "Expand": {
        setCollapse(false)
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
  const siderCenter: SiderCenterProps[] = [
    {
      key: "Import",
      name: "newResource",
      icon: <IconImport style={{ fontSize: 20 }} />,
      showDivider: true,
      onClick: () => {
        importResourceStore.setImportResourceModalVisible(true)
        importResourceStore.setSelectedMenuItem("import-from-weblink")
      },
    },
    {
      key: "Workspace",
      name: "homePage",
      icon: <HiOutlineHome className="arco-icon" style={{ fontSize: 20 }} />,
    },
    {
      key: "Skill",
      name: "skill",
      icon: <RiRobot2Line className="arco-icon" style={{ fontSize: 20 }} />,
    },
    {
      key: "ThreadLibrary",
      name: "threadLibrary",
      icon: <RiHistoryLine className="arco-icon" style={{ fontSize: 20 }} />,
    },
  ]
  return (
    <Sider
      className={`app-sider ${isGuideDetail ? "fixed" : ""}`}
      width={collapse ? 90 : 220}>
      <div
        className={`sider-header ${collapse ? "sider-header-collapse" : ""}`}>
        <SiderLogo
          navigate={path => navigate(path)}
          collapse={collapse}
          setCollapse={() => setCollapse(!collapse)}
        />

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
                <div key={item.key}>
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
                  {item.showDivider && (
                    <Divider
                      key={item.key + "divider"}
                      style={{ margin: "8px 0" }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="sider-footer">
            {collapse && (
              <MenuItem
                key="Expand"
                className="custom-menu-item"
                renderItemInTooltip={() => (
                  <MenuItemTooltipContent
                    title={t("loggedHomePage.siderMenu.expand")}
                  />
                )}>
                <MenuItemContent
                  icon={
                    <AiOutlineMenuUnfold
                      className="arco-icon"
                      style={{ fontSize: 20 }}
                    />
                  }
                  title={t("loggedHomePage.siderMenu.expand")}
                />
              </MenuItem>
            )}

            {!!userStore.userProfile?.uid && (
              <MenuItem
                key="Settings"
                className={`menu-setting-container setting-menu-item ${collapse ? "setting-menu-item-collapse" : ""}`}
                renderItemInTooltip={() => (
                  <MenuItemTooltipContent
                    title={t("loggedHomePage.siderMenu.settings")}
                  />
                )}>
                <SettingItem></SettingItem>
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
                icon={
                  <AiOutlineTwitter
                    className="arco-icon"
                    style={{ fontSize: 20 }}
                  />
                }
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
                icon={
                  <LuDownload className="arco-icon" style={{ fontSize: 20 }} />
                }
                title={t("loggedHomePage.siderMenu.download")}
              />
            </MenuItem>
          </div>
        </Menu>
      </div>
    </Sider>
  )
}
