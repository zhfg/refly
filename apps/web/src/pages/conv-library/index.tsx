import { Helmet } from "react-helmet"
import "./index.scss"
// components
import { ConvList } from "@refly/ai-workspace-common/components/conv-list"
import { useTranslation } from "react-i18next"
import { useKnowledgeBaseJumpNewPath } from "@refly/ai-workspace-common/hooks/use-jump-new-path"
import { Button, Typography } from "@arco-design/web-react"

export const ConvLibrary = () => {
  const { t } = useTranslation()
  const { jumpToConv } = useKnowledgeBaseJumpNewPath()

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      {/* <Header /> */}
      <Helmet>
        <title>
          {t("productName")} | {t("tabMeta.threadLibrary.title")}
        </title>
      </Helmet>
      <div className="conv-library-header">
        <Typography.Title heading={4}>
          {t("tabMeta.threadLibrary.title")}
        </Typography.Title>
        <Button
          type="primary"
          style={{ width: 120, borderRadius: 8 }}
          onClick={() =>
            jumpToConv({
              convId: "",
            })
          }>
          新会话
        </Button>
      </div>
      <ConvList
        classNames=""
        handleConvItemClick={convId => {
          jumpToConv({
            convId,
          })
        }}
      />
    </div>
  )
}
