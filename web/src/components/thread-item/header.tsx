import Logo from "@/assets/logo.svg"
import CloseGraySVG from "@/assets/side/close.svg"
import NotificationSVG from "@/assets/side/notification.svg"
import SettingGraySVG from "@/assets/side/setting.svg"
import FullScreenSVG from "@/assets/side/full-screen.svg"
import { IconTip } from "@/components/home/icon-tip"
import { Avatar, Button } from "@arco-design/web-react"
import { useSiderStore } from "@/stores/sider"
import { useNavigate } from "react-router-dom"
import {
  IconMenu,
  IconMore,
  IconShareExternal,
} from "@arco-design/web-react/icon"

export const Header = () => {
  const siderStore = useSiderStore()
  const navigate = useNavigate()

  return (
    <header>
      <div></div>
      <div className="funcs">
        <Button type="text" icon={<IconMore />}></Button>
        <Button
          type="primary"
          icon={<IconShareExternal />}
          style={{ borderRadius: 4 }}>
          分享
        </Button>
      </div>
    </header>
  )
}
