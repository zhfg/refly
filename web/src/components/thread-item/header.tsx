import { Button, Message as message } from "@arco-design/web-react"
import { useSiderStore } from "@/stores/sider"
import { useNavigate } from "react-router-dom"
import {
  IconClockCircle,
  IconMenu,
  IconMessage,
  IconMore,
  IconShareExternal,
} from "@arco-design/web-react/icon"
import { copyToClipboard } from "@/utils"
import { time } from "@/utils/time"
import { useConversationStore } from "@/stores/conversation"

export const Header = () => {
  const conversationStore = useConversationStore()

  return (
    <header>
      <div>
        <span key={2}>
          <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
          <span className="thread-library-list-item-text">
            {time(conversationStore?.currentConversation?.updatedAt)
              .utc()
              .fromNow()}
          </span>
        </span>
      </div>
      <div className="funcs">
        {/* <Button type="text" icon={<IconMore />}></Button> */}
        <Button
          type="primary"
          icon={<IconShareExternal />}
          onClick={() => {
            copyToClipboard(location.href)
            message.success("分享链接已复制到剪切板")
          }}
          style={{ borderRadius: 4 }}>
          分享
        </Button>
      </div>
    </header>
  )
}
