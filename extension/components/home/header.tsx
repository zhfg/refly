// 静态资源
import Logo from "~assets/logo.svg"
import CloseGraySVG from "~assets/side/close.svg"
import NotificationSVG from "~assets/side/notification.svg"
import SettingGraySVG from "~assets/side/setting.svg"
import FullScreenSVG from "~assets/side/full-screen.svg"

// 组件
import { IconTip } from "./icon-tip"
import { Avatar } from "@arco-design/web-react"
// stores
import { useSiderStore } from "~stores/sider"
import { useNavigate } from "react-router-dom"
import { getClientOrigin } from "~utils/url"
import { useUserStore } from "~stores/user"
import { useHomeStateStore } from "~stores/home-state"
import { useSelectedMark } from "~hooks/use-selected-mark"

export const ChatHeader = (props: { onlyShowClose?: boolean }) => {
  const { onlyShowClose = false } = props
  const siderStore = useSiderStore()
  const navigate = useNavigate()
  const { userProfile } = useUserStore()
  const homeStateStore = useHomeStateStore()
  const { handleResetState } = useSelectedMark()

  const showBtn = !!userProfile?.id

  return (
    <header>
      <div
        className="brand"
        onClick={() => {
          window.open(`${getClientOrigin()}/`, "_blank")
          homeStateStore.setActiveTab("home")
        }}>
        {onlyShowClose ? null : (
          <>
            <img src={Logo} alt="Refly" />
            <span>Refly</span>
          </>
        )}
      </div>
      <div className="funcs">
        {!onlyShowClose && (
          <IconTip text="全屏">
            <img
              src={FullScreenSVG}
              alt="全屏"
              style={{ marginRight: 12 }}
              onClick={() => window.open(`${getClientOrigin()}/`, "_blank")}
            />
          </IconTip>
        )}
        {/* <IconTip text="通知">
                <img src={NotificationSVG} alt="通知" />
            </IconTip> */}
        {showBtn && !onlyShowClose && (
          <IconTip text="设置">
            <img
              src={SettingGraySVG}
              alt="设置"
              style={{ marginRight: 12 }}
              onClick={() =>
                window.open(`${getClientOrigin()}/settings`, "_blank")
              }
            />
          </IconTip>
        )}
        {showBtn && !onlyShowClose && (
          <IconTip text="账户">
            <Avatar size={16} style={{ marginRight: 12 }}>
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
            onClick={(_) => {
              siderStore.setShowSider(false)
              handleResetState()
            }}
          />
        </IconTip>
      </div>
    </header>
  )
}
