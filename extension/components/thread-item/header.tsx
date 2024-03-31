import Logo from "~assets/logo.svg"
import CloseGraySVG from "~assets/side/close.svg"
import SendSVG from "~assets/side/send.svg"
import NotificationSVG from "~assets/side/notification.svg"
import SettingGraySVG from "~assets/side/setting.svg"
import FullScreenSVG from "~assets/side/full-screen.svg"
import { IconTip } from "~components/home/icon-tip"
import { Avatar } from "@arco-design/web-react"
import { useSiderStore } from "~stores/sider"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "~stores/user"
import { getClientOrigin } from "~utils/url"

export const Header = () => {
  const siderStore = useSiderStore()
  const navigate = useNavigate()
  const { userProfile } = useUserStore()

  const showBtn = !!userProfile?.id

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
          <img
            src={FullScreenSVG}
            alt="全屏"
            onClick={() =>
              window.open(`${getClientOrigin()}/dashboard`, "_blank")
            }
          />
        </IconTip>
        {/* <IconTip text="通知">
                    <img src={NotificationSVG} alt="通知" />
                </IconTip> */}
        {showBtn && (
          <IconTip text="设置">
            <img
              src={SettingGraySVG}
              alt="设置"
              onClick={() =>
                window.open(`${getClientOrigin()}/settings`, "_blank")
              }
            />
          </IconTip>
        )}
        {showBtn && (
          <IconTip text="账户">
            <Avatar size={16}>
              <img
                alt="avatar"
                src={userProfile?.avatar}
                onClick={() =>
                  window.open(`${getClientOrigin()}/settings`, "_blank")
                }
              />
            </Avatar>
          </IconTip>
        )}
        <IconTip text="关闭">
          <img
            src={CloseGraySVG}
            alt="关闭"
            onClick={(_) => siderStore.setShowSider(false)}
          />
        </IconTip>
      </div>
    </header>
  )
}
