import { Button, Message as message, Breadcrumb } from "@arco-design/web-react"
import { IconClockCircle, IconShareExternal } from "@arco-design/web-react/icon"
import { copyToClipboard } from "@/utils"
import { time } from "@/utils/time"
import { Thread } from "@/types"

interface HeaderProps {
  thread: Thread
}

const BreadcrumbItem = Breadcrumb.Item

export const Header = (props: HeaderProps) => {
  const { thread } = props

  return (
    <header>
      <div>
        <Breadcrumb>
          <BreadcrumbItem href="/thread">会话库</BreadcrumbItem>
          <BreadcrumbItem href={`/thread/${thread?.id}`}>
            {thread?.title}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="funcs">
        {/* <Button type="text" icon={<IconMore />}></Button> */}
        <span key={2} style={{ display: "inline-block", marginRight: 12 }}>
          <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
          <span className="thread-library-list-item-text">
            {time(thread?.updatedAt).utc().fromNow()}
          </span>
        </span>
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
