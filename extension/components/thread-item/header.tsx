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
import {
  IconClockCircle,
  IconHome,
  IconPlus,
  IconShareExternal,
} from "@arco-design/web-react/icon"
import { time } from "~utils/time"
// types
import type { Conversation } from "~types/conversation"
// 第三方库
import copyToClipboard from "copy-to-clipboard"
import { useHomeStateStore } from "~stores/home-state"
import { useTranslation } from "react-i18next"
import { LOCALE } from "~types"

interface ThreadHeaderProps {
  thread: Conversation
}

export const Header = (props: ThreadHeaderProps) => {
  const siderStore = useSiderStore()
  const navigate = useNavigate()
  const { userProfile } = useUserStore()
  const homeStateStore = useHomeStateStore()

  const { t, i18n } = useTranslation()
  const showBtn = !!userProfile?.uid
  const uiLocale = i18n?.languages?.[0] as LOCALE

  return (
    <header>
      <div
        className="refly-brand-container"
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <div
          className="brand"
          onClick={() => {
            window.open(`${getClientOrigin()}/`, "_blank")
          }}>
          <img src={Logo} alt="Refly" />
          <span>Refly</span>
        </div>
        <Button
          type="primary"
          onClick={() => {
            navigate("/")
            homeStateStore.setActiveTab("home")
          }}
          style={{ borderRadius: 4, marginLeft: 12 }}>
          <span
            style={{
              fontSize: uiLocale === LOCALE.EN ? 12 : 14,
              fontWeight: "normal",
              color: "#fff",
            }}>
            {t("translation:threadDetail.header.newThread")}
          </span>
        </Button>
      </div>
      <div className="funcs">
        <span key={2} style={{ display: "inline-block", marginRight: 12 }}>
          <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
          <span
            className="thread-library-list-item-text"
            style={{ fontSize: uiLocale === LOCALE.EN ? 12 : 14 }}>
            {time(props.thread?.updatedAt, uiLocale).utc().fromNow()}
          </span>
        </span>
        <IconTip text={t("translation:loggedHomePage.homePage.header.close")}>
          <img
            src={CloseGraySVG}
            alt={t("translation:loggedHomePage.homePage.header.close")}
            onClick={(_) => siderStore.setShowSider(false)}
          />
        </IconTip>
      </div>
    </header>
  )
}
