import { Avatar, Divider, Layout, Menu } from "@arco-design/web-react"
import { useLocation, useNavigate } from "react-router-dom"
import { ReactText } from "react"
import {
  IconHome,
  IconSettings,
  IconDownload,
  IconBook,
  IconHistory,
  IconBulb,
  IconTwitter,
} from "@arco-design/web-react/icon"
import { openGetStartDocument } from "../../utils"
// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"
import { useUserStore } from "@/stores/user"
import { safeParseJSON } from "@/utils/parse"

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

type NavData = {
  itemKey: ReactText
  isOpen: boolean
  domEvent: MouseEvent
}

export const SiderLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStore()
  const isGuideDetail = location.pathname.includes("guide/")

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  const notShowLoginBtn = storageUserProfile?.id || userStore?.userProfile?.id
  console.log("storageUserProfile", storageUserProfile, userStore?.userProfile)

  const selectedKey = getNavSelectedKeys(location.pathname)
  const handleNavClick = (itemKey: string, event, keyPath: string[]) => {
    switch (itemKey) {
      case "Home": {
        navigate(`/dashboard`)
        break
      }

      case "ThreadLibrary": {
        navigate(`/thread`)
        break
      }

      case "Settings": {
        navigate(`/settings`)
        break
      }

      case "Feed": {
        navigate(`/feed`)
        break
      }

      case "Digest": {
        navigate(`/digest`)
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
    <Sider className={`app-sider ${isGuideDetail ? "fixed" : ""}`}>
      <div className="sider-header">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}>
          <div className="logo" onClick={() => navigate("/dashboard")}>
            <img src={Logo} alt="Refly" />
            <span>Refly</span>
          </div>
        </div>
        <Menu
          style={{
            width: 200,
            backgroundColor: "transparent",
            borderRight: "none",
          }}
          className="sider-menu-nav"
          selectedKeys={[selectedKey]}
          onClickMenuItem={handleNavClick}>
          <div className="sider-header">
            <MenuItem key="Home" className="custom-menu-item">
              <IconHome style={{ fontSize: 20 }} />
              <span className="sider-menu-title">主页</span>
            </MenuItem>
            {/* <MenuItem key='Explore' ><IconHome style={{ fontSize: 20 }} />主页</MenuItem> */}
            <MenuItem key="Digest" className="custom-menu-item">
              <IconHistory style={{ fontSize: 20 }} />
              <span className="sider-menu-title">回忆</span>
            </MenuItem>
            <MenuItem key="Feed" className="custom-menu-item">
              <IconBulb style={{ fontSize: 20 }} />
              <span className="sider-menu-title">探索</span>
            </MenuItem>
            <MenuItem key="ThreadLibrary" className="custom-menu-item">
              <IconBook style={{ fontSize: 20 }} />
              <span className="sider-menu-title">会话库</span>
            </MenuItem>
          </div>
          <div className="sider-footer">
            <MenuItem key="GetHelp" className="custom-menu-item">
              <IconTwitter style={{ fontSize: 20 }} />
              <span className="sider-menu-title">获得帮助</span>
            </MenuItem>
            <Divider style={{ margin: "8px 0" }} />
            {!!userStore.userProfile?.id && (
              <MenuItem
                key="Settings"
                className="menu-setting-container custom-menu-item">
                <div className="menu-settings">
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
                <IconSettings style={{ fontSize: 20 }} />
              </MenuItem>
            )}
            <Divider style={{ margin: "8px 0" }} />
            <MenuItem key="DownloadExtension" className="custom-menu-item">
              <IconDownload style={{ fontSize: 20 }} />
              <span className="sider-menu-title">下载插件</span>
            </MenuItem>
          </div>
        </Menu>
      </div>
    </Sider>
  )
}
