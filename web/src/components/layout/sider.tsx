import { Layout, Menu } from "@arco-design/web-react"
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

      case "MyGuide": {
        navigate(`/guidera/guides`)
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
            width: "100%",
            backgroundColor: "transparent",
            borderRight: "none",
          }}
          onClickMenuItem={handleNavClick}
          defaultSelectedKeys={[selectedKey]}>
          <MenuItem key="Home">
            <IconHome style={{ fontSize: 16 }} />
            主页
          </MenuItem>
          {/* <MenuItem key='Explore' ><IconHome style={{ fontSize: 16 }} />主页</MenuItem> */}
          <MenuItem key="ThreadLibrary">
            <IconBook style={{ fontSize: 16 }} />
            会话库
          </MenuItem>
        </Menu>
      </div>
      <div className="sider-footer">
        {/* <div className="invite-member">邀请新成员</div> */}
        <Menu
          onClickMenuItem={handleNavClick}
          style={{
            width: "100%",
            backgroundColor: "transparent",
            borderRight: "none",
          }}>
          <MenuItem key="Docs">
            <IconCustomerService style={{ fontSize: 16 }} />
            查看文档
          </MenuItem>
          <MenuItem key="Download">
            <IconSettings style={{ fontSize: 16 }} />
            设置
          </MenuItem>
          <MenuItem key="Download">
            <IconDownload style={{ fontSize: 16 }} />
            下载插件
          </MenuItem>
        </Menu>
      </div>
    </Sider>
  )
}
