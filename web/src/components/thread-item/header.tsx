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
      <IconTip text="账户">
        <Avatar size={20}>
          <img
            alt="avatar"
            src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
          />
        </Avatar>
      </IconTip>
      <div className="funcs">
        <Button type="text" icon={<IconMore />}></Button>
        <Button type="primary" icon={<IconShareExternal />}>
          分享
        </Button>
      </div>
    </header>
  )
}
