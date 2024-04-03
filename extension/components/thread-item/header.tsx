import Logo from "~assets/logo.svg"
import CloseGraySVG from "~assets/side/close.svg"
import SendSVG from "~assets/side/send.svg"
import NotificationSVG from "~assets/side/notification.svg"
import SettingGraySVG from "~assets/side/setting.svg"
import FullScreenSVG from "~assets/side/full-screen.svg"
import { IconTip } from "~components/home/icon-tip"
import { Avatar, Button, Message as message } from "@arco-design/web-react"
import { useSiderStore } from "~stores/sider"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "~stores/user"
import { getClientOrigin } from "~utils/url"
import { IconClockCircle, IconShareExternal } from "@arco-design/web-react/icon"
import { time } from "~utils/time"
// types
import type { Conversation } from "~types/conversation"
// 第三方库
import copyToClipboard from "copy-to-clipboard"

interface ThreadHeaderProps {
  thread: Conversation
}

export const Header = (props: ThreadHeaderProps) => {
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
        <span key={2} style={{ display: "inline-block", marginRight: 12 }}>
          <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
          <span className="thread-library-list-item-text">
            {time(props.thread?.updatedAt).utc().fromNow()}
          </span>
        </span>
        <Button
          type="primary"
          icon={<IconShareExternal />}
          onClick={() => {
            copyToClipboard(`${getClientOrigin()}/thread/${props.thread?.id}`)
            message.success("分享链接已复制到剪切板")
          }}
          style={{ borderRadius: 4, marginRight: 12 }}>
          分享
        </Button>
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
