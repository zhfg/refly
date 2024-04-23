import { Button, Message as message, Breadcrumb } from "@arco-design/web-react"
import { IconClockCircle, IconShareExternal } from "@arco-design/web-react/icon"
import { copyToClipboard } from "@/utils"
import { time } from "@/utils/time"
import { Digest, Feed, LOCALE } from "@/types"
import { useTranslation } from "react-i18next"

interface HeaderProps {
  digest: Digest | Feed
}

const BreadcrumbItem = Breadcrumb.Item

export const Header = (props: HeaderProps) => {
  const { digest } = props

  const { t, i18n } = useTranslation()
  const language = i18n.languages?.[0]

  return (
    <header>
      <div>
        <Breadcrumb>
          <BreadcrumbItem href="/">
            {t("contentDetail.breadcrumb.homePage")}
          </BreadcrumbItem>
          <BreadcrumbItem
            href={`/digest/${digest?.id}`}
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
            {time(digest?.updatedAt, language as LOCALE)
              .utc()
              .fromNow()}
          </span>
        </span>
        <Button
          type="primary"
          icon={<IconShareExternal />}
          onClick={() => {
            copyToClipboard(`${window.origin}/content/${digest?.id}`)
            message.success(t("contentDetail.item.copyNotify"))
          }}
          style={{ borderRadius: 4 }}>
          {t("contentDetail.item.share")}
        </Button>
      </div>
    </header>
  )
}
