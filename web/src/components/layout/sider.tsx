import { Button, Layout, Menu } from "@arco-design/web-react"
import { useLocation, useNavigate } from "react-router-dom"
import { ReactText } from "react"
import {
  IconHome,
  IconSettings,
  IconDownload,
  IconBook,
  IconCustomerService,
} from "@arco-design/web-react/icon"
import { downloadPlugin, openGetStartDocument } from "../../utils"
// 静态资源
import Logo from "@/assets/logo.svg"
import "./sider.scss"

const Sider = Layout.Sider
const MenuItem = Menu.Item

const getNavSelectedKeys = (pathname = "") => {
  if (pathname.includes("guidera/guides")) {
    return "MyGuide"
  } else if (pathname.includes("settings/profile")) {
    return "Settings"
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

  const isGuideDetail = location.pathname.includes("guide/")

  const selectedKey = getNavSelectedKeys(location.pathname)
  const handleNavClick = (itemKey: string, event, keyPath: string[]) => {
    switch (itemKey) {
      case "Home": {
        navigate(`/`)
        break
      }

      case "ThreadLibrary": {
        navigate(`/thread`)
        break
      }

      case "Settings": {
        navigate(`/settings/profile`)
        break
      }

      case "Explore": {
        navigate(`/explore`)
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
        downloadPlugin()
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
          <div className="logo" onClick={() => navigate("/")}>
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
          onClickMenuItem={handleNavClick}
          defaultSelectedKeys={[selectedKey]}>
          <div className="sider-header">
            <MenuItem key="Home">
              <IconHome style={{ fontSize: 20 }} />
              <span className="sider-menu-title">主页</span>
            </MenuItem>
            {/* <MenuItem key='Explore' ><IconHome style={{ fontSize: 20 }} />主页</MenuItem> */}
            <MenuItem key="ThreadLibrary">
              <IconBook style={{ fontSize: 20 }} />
              <span className="sider-menu-title">会话库</span>
            </MenuItem>
          </div>
          <div className="sider-footer">
            <MenuItem key="Docs">
              <IconCustomerService style={{ fontSize: 20 }} />
              <span className="sider-menu-title">查看文档</span>
            </MenuItem>
            <MenuItem key="Settings">
              <IconSettings style={{ fontSize: 20 }} />
              <span className="sider-menu-title">设置</span>
            </MenuItem>
            <MenuItem key="Download">
              <IconDownload style={{ fontSize: 20 }} />
              <span className="sider-menu-title">下载插件</span>
            </MenuItem>
          </div>
        </Menu>
      </div>
    </Sider>
  )
}
