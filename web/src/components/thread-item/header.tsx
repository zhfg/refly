import Logo from "@/assets/logo.svg"
import CloseGraySVG from "@/assets/side/close.svg"
import NotificationSVG from "@/assets/side/notification.svg"
import SettingGraySVG from "@/assets/side/setting.svg"
import FullScreenSVG from "@/assets/side/full-screen.svg"
import { IconTip } from "@/components/home/icon-tip"
import { Avatar } from "@arco-design/web-react"
import { useSiderStore } from "@/stores/sider"
import { useNavigate } from "react-router-dom"

export const Header = () => {
  const siderStore = useSiderStore()
  const navigate = useNavigate()

  return (
    <header>
      <div
        className="brand"
        onClick={() => {
          navigate("/")
        }}>
        <img src={Logo} alt="Refly" />
        <span>Refly</span>
      </div>
      <div className="funcs">
        <IconTip text="全屏">
          <img src={FullScreenSVG} alt="全屏" />
        </IconTip>
        <IconTip text="通知">
          <img src={NotificationSVG} alt="通知" />
        </IconTip>
        <IconTip text="设置">
          <img src={SettingGraySVG} alt="设置" />
        </IconTip>
        <IconTip text="账户">
          <Avatar size={16}>
            <img
              alt="avatar"
              src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
            />
          </Avatar>
        </IconTip>
        <IconTip text="关闭">
          <img
            src={CloseGraySVG}
            alt="关闭"
            onClick={() => siderStore.setShowSider(false)}
          />
        </IconTip>
      </div>
    </header>
  )
}
