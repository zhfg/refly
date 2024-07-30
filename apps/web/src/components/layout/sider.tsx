import {
  Avatar,
  Button,
  Divider,
  Layout,
  Menu,
  Tag,
} from "@arco-design/web-react"
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
  }

  return "Workspace"
}

export const SiderLayout = () => {
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

  return (
    <Sider className={`app-sider ${isGuideDetail ? "fixed" : ""}`} width={220}>
      <div className="sider-header">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}>
          <div className="logo" onClick={() => navigate("/")}>
            <img src={Logo} alt="Refly" />
            <span>Refly </span>
            <Tag color="#00968F" className="logo-beta" size="small">
              Beta
            </Tag>
          </div>
        </div>
        <SearchQuickOpenBtn />
        <div className="sider-import-container">
          <button
            className="sider-import-btn"
            onClick={() =>
              importResourceStore.setImportResourceModalVisible(true)
            }>
            <IconImport style={{ fontSize: 20 }} />
            <span className="sider-menu-title">添加资源</span>
          </button>
        </div>

        <Menu
          style={{
            width: 220,
            backgroundColor: "transparent",
            borderRight: "none",
          }}
          defaultSelectedKeys={["Workspace"]}
          className="sider-menu-nav"
          selectedKeys={[selectedKey]}
          onClickMenuItem={handleNavClick}>
          <div className="sider-header">
            {/* <MenuItem key="News" className="custom-menu-item">
              <IconThunderbolt style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.news")}
              </span>
            </MenuItem> */}
            <Divider style={{ margin: "16px 0" }} />
            <MenuItem key="Workspace" className="custom-menu-item">
              <IconHome style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.homePage")}
              </span>
            </MenuItem>
            <MenuItem key="ThreadLibrary" className="custom-menu-item">
              <IconMessage style={{ fontSize: 20 }} />
              <span className="sider-menu-title">会话</span>
            </MenuItem>
            {/* <MenuItem key='Explore' ><IconHome style={{ fontSize: 20 }} />主页</MenuItem> */}
            {/* <MenuItem key="Digest" className="custom-menu-item">
              <IconHistory style={{ fontSize: 20 }} />
              <span className="sider-menu-title">回忆</span>
            </MenuItem> */}
            {/* <MenuItem key="Explore" className="custom-menu-item">
              <IconFire style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.explore")}
              </span>
            </MenuItem> */}
          </div>
          <div className="sider-footer">
            <MenuItem key="GetHelp" className="custom-menu-item">
              <IconTwitter style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.getHelp")}
              </span>
            </MenuItem>
            {!!userStore.userProfile?.uid && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <MenuItem
                  key="Settings"
                  className="menu-setting-container setting-menu-item">
                  <div
                    className="menu-settings"
                    onClick={() => {
                      navigate("/settings")
                    }}>
                    <Avatar size={32}>
                      <img
                        src={userStore?.userProfile?.avatar || ""}
                        alt="user-avatar"
                      />
                    </Avatar>
                    <span className="username">
                      {userStore?.userProfile?.name}
                    </span>
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
                </MenuItem>
              </>
            )}
            <Divider style={{ margin: "8px 0" }} />
            <MenuItem key="DownloadExtension" className="custom-menu-item">
              <IconDownload style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.download")}
              </span>
            </MenuItem>
          </div>
        </Menu>
      </div>
    </Sider>
  )
}
