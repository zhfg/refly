import { Avatar, Divider, Layout, Menu } from "@arco-design/web-react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  IconHome,
  IconSettings,
  IconDownload,
  IconBook,
  IconTwitter,
  IconLanguage,
} from "@arco-design/web-react/icon"
import { openGetStartDocument } from "../../utils"
// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"
import { useUserStore } from "@/stores/user"
import { safeParseJSON } from "@/utils/parse"
// components
import { SearchQuickOpenBtn } from "@/components/search-quick-open-btn"
import { UILocaleList } from "../ui-locale-list"
import { useTranslation } from "react-i18next"

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

  return "Home"
}

export const SiderLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStore()
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
      case "Home": {
        if (!notShowLoginBtn) {
          userStore.setLoginModalVisible(true)
        } else {
          navigate(`/`)
        }
        break
      }

      case "ThreadLibrary": {
        if (!notShowLoginBtn) {
          userStore.setLoginModalVisible(true)
        } else {
          navigate(`/thread`)
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
            <span>Refly</span>
          </div>
        </div>
        <SearchQuickOpenBtn />
        <Menu
          style={{
            width: 220,
            backgroundColor: "transparent",
            borderRight: "none",
          }}
          className="sider-menu-nav"
          selectedKeys={[selectedKey]}
          onClickMenuItem={handleNavClick}>
          <div className="sider-header">
            <MenuItem key="Home" className="custom-menu-item">
              <IconHome style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.homePage")}
              </span>
            </MenuItem>
            {/* <MenuItem key='Explore' ><IconHome style={{ fontSize: 20 }} />主页</MenuItem> */}
            {/* <MenuItem key="Digest" className="custom-menu-item">
              <IconHistory style={{ fontSize: 20 }} />
              <span className="sider-menu-title">回忆</span>
            </MenuItem> */}
            <MenuItem key="ThreadLibrary" className="custom-menu-item">
              <IconBook style={{ fontSize: 20 }} />
              <span className="sider-menu-title">
                {t("loggedHomePage.siderMenu.threadLibrary")}
              </span>
            </MenuItem>
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
