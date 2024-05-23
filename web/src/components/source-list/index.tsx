import { Source } from "@/types"
import { List, Skeleton, Typography } from "@arco-design/web-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface SourceListProps {
  sources: Source[]
  isPending: boolean
  isLastSession: boolean
}

export const SourceList = (props: SourceListProps) => {
  const { isPending = false, isLastSession = false } = props
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>)
  const { t } = useTranslation()

  return (props?.sources || []).length > 0 ? (
    <div className="session-source-content">
      <div className="session-source-list">
        <List
          className="session-source-list-item"
          wrapperStyle={{ width: "100%" }}
          bordered={false}
          pagination={{ pageSize: 4 }}
          dataSource={props?.sources}
          scrollLoading={
            (props?.sources || []).length > 0 ? null : scrollLoading
          }
          noDataElement={<div>{t("threadDetail.item.noMoreText")}</div>}
          render={(item, index) => (
            <List.Item
              key={index}
              style={{
                borderBottom: "0.5px solid var(--color-fill-3)",
              }}
              actionLayout="vertical"
              actions={[
                <span
                  key={1}
                  className="session-source-list-item-action"
                  onClick={() => {}}>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${item?.metadata?.source}&sz=${16}`}
                    alt={item?.metadata?.source}
                  />
                </span>,
                <a target="_blank" href={item.metadata?.source}>
                  <span key={2} className="session-source-list-item-action">
                    <Typography.Paragraph
                      ellipsis={{ rows: 1, wrapper: "span" }}
                      style={{
                        fontSize: 10,
                        color: "rgba(0, 0, 0, .4)",
                      }}>
                      · {item.metadata?.source} ·
                    </Typography.Paragraph>
                  </span>
                </a>,
                <span
                  key={2}
                  className="session-source-list-item-action"
                  style={{
                    fontSize: 10,
                    color: "rgba(0, 0, 0, .4)",
                  }}>
                  #{index + 1}
                </span>,
              ]}>
              <List.Item.Meta
                title={
                  <a href={item.metadata?.source}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(0, 0, 0, .8)",
                        fontWeight: "bold",
                      }}>
                      {item.metadata?.title}
                    </span>
                  </a>
                }
                description={
                  <Typography.Paragraph
                    ellipsis={{ rows: 1, wrapper: "span" }}
                    style={{
                      fontSize: 10,
                      color: "rgba(0, 0, 0, .8)",
                    }}>
                    {item.pageContent}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  ) : isPending && isLastSession ? (
    <Skeleton animation></Skeleton>
  ) : null
}
