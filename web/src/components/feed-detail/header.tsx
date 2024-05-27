import { Button, Message as message, Breadcrumb } from "@arco-design/web-react"
import { IconClockCircle, IconShareExternal } from "@arco-design/web-react/icon"
import { copyToClipboard } from "@/utils"
import { time } from "@/utils/time"
import { Digest, Feed } from "@/types"

interface HeaderProps {
  digest: Digest | Feed
}

const BreadcrumbItem = Breadcrumb.Item

export const Header = (props: HeaderProps) => {
  const { digest } = props

  return (
    <header>
      <div>
        <Breadcrumb>
          <BreadcrumbItem href="/feed">探索</BreadcrumbItem>
          <BreadcrumbItem
            href={`/feed/${digest?.cid}`}
            className="breadcrum-description">
            {digest?.title}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="funcs">
        {/* <Button type="text" icon={<IconMore />}></Button> */}
        <span key={2} style={{ display: "inline-block", marginRight: 12 }}>
          <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
          <span className="thread-library-list-item-text">
            {time(digest?.updatedAt).utc().fromNow()}
          </span>
        </span>
        <Button
          type="primary"
          icon={<IconShareExternal />}
          onClick={() => {
            copyToClipboard(`${window.origin}/content/${digest?.cid}`)
            message.success("分享链接已复制到剪切板")
          }}
          style={{ borderRadius: 4 }}>
          分享
        </Button>
      </div>
    </header>
  )
}
