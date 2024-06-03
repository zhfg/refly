/**
 * 只聚焦昨天、今天、这周、这个月最核心的内容，剩下的让用户去归档里面查看，能够对自己的工作有一个明确的感知
 */

import { time } from "@refly/ai-workspace-common/utils/time"
import {
  List,
  Skeleton,
  Typography,
  Message as message,
} from "@arco-design/web-react"
import {
  IconClockCircle,
  IconLink,
  IconRightCircle,
  IconShareExternal,
  IconTag,
} from "@arco-design/web-react/icon"
import { useNavigate } from "react-router-dom"
// types
import { Digest, Source } from "@refly/openapi-schema"
import { IconTip } from "@refly/ai-workspace-common/components/dashboard/icon-tip"
import { copyToClipboard } from "@refly/ai-workspace-common/utils"
import {
  getClientOrigin,
  safeParseURL,
} from "@refly/ai-workspace-common/utils/url"
// stores
import {
  DigestType,
  useDigestStore,
} from "@refly/ai-workspace-common/stores/digest"
// components
import { useEffect, useState } from "react"
import { EmptyDigestStatus } from "@refly/ai-workspace-common/components/empty-digest-today-status"
// utils
import client from "@refly/ai-workspace-common/requests/proxiedRequest"
// styles
import "./index.scss"
import { LOCALE } from "@refly/constants"
import { useTranslation } from "react-i18next"

export const getFirstSourceLink = (sources: Source[]) => {
  return sources?.[0]?.metadata?.source
}

export const DigestToday = () => {
  const navigate = useNavigate()
  const digestStore = useDigestStore()
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation style={{ width: "100%" }}></Skeleton>,
  )
  const { t, i18n } = useTranslation()
  const language = i18n.languages?.[0]

  const fetchData = async (currentPage = 1) => {
    let newData: Digest[] = []

    try {
      setScrollLoading(
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}>
          <Skeleton animation style={{ width: "100%" }}></Skeleton>
          <Skeleton
            animation
            style={{ width: "100%", marginTop: 24 }}></Skeleton>
        </div>,
      )

      if (!digestStore.today.hasMore && currentPage !== 1) {
        setScrollLoading(
          <span>{t("knowledgeLibrary.archive.item.noMoreText")}</span>,
        )

        return
      }

      const { data: newRes, error } = await client.getDigestList({
        body: {
          // TODO: confirm time filter
          page: currentPage,
          pageSize: digestStore.today.pageSize,
        },
      })

      if (error) {
        throw error
      }

      digestStore.updatePayload(
        { ...digestStore.today, currentPage },
        DigestType.TODAY,
      )

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }
      if (newRes?.data && newRes?.data?.length < digestStore.today?.pageSize) {
        digestStore.updatePayload(
          { ...digestStore.today, hasMore: false },
          DigestType.TODAY,
        )
      }

      console.log("newRes", newRes)
      const newFeatureList = digestStore.today.featureList.concat(
        newRes?.data || [],
      )
      newData = newRes?.data || []
      digestStore.updatePayload(
        { ...digestStore.today, featureList: newFeatureList },
        DigestType.TODAY,
      )
    } catch (err) {
      message.error(t("knowledgeLibrary.archive.list.fetchErr"))
    } finally {
      const { today } = useDigestStore.getState()

      if (today?.featureList?.length === 0) {
        setScrollLoading(<EmptyDigestStatus />)
      } else if (newData?.length >= 0 && newData?.length < today?.pageSize) {
        setScrollLoading(
          <span>{t("knowledgeLibrary.archive.item.noMoreText")}</span>,
        )
      }
    }
  }

  useEffect(() => {
    fetchData()

    return () => {
      digestStore.resetState()
    }
  }, [])

  return (
    <div className="today-container">
      <div className="today-feature-container">
        {/* <div className="today-block-header"> */}
        {/* <div className="header-title">今天浏览内容总结</div> */}
        {/* <div className="header-switch">
            <span className="header-featured">精选</span>
            <span className="header-all">全部</span>
          </div> */}
        {/* </div> */}
        <List
          className="digest-list"
          wrapperStyle={{ width: "100%" }}
          bordered={false}
          pagination={false}
          offsetBottom={200}
          // header={
          //   <p className="today-header-title">
          //     {t("knowledgeLibrary.archive.title")}
          //   </p>
          // }
          dataSource={digestStore?.today?.featureList || []}
          scrollLoading={scrollLoading}
          onReachBottom={currentPage => fetchData(currentPage)}
          render={(item: Digest) => (
            <List.Item
              key={item?.cid}
              style={{
                padding: "20px 0",
                borderBottom: "1px solid var(--color-fill-3)",
              }}
              actionLayout="vertical"
              actions={[
                <div className="feed-item-action-container">
                  <div className="feed-item-action">
                    <span
                      key={1}
                      className="feed-list-item-continue-ask with-border with-hover"
                      onClick={() => {
                        navigate(`/digest/${item?.cid}`)
                      }}>
                      <IconRightCircle
                        style={{ fontSize: 14, color: "#64645F" }}
                      />
                      <span className="feed-list-item-text">
                        {t("knowledgeLibrary.archive.item.askFollow")}
                      </span>
                    </span>
                    <IconTip text={t("knowledgeLibrary.archive.item.copy")}>
                      <span
                        key={1}
                        className="feed-list-item-continue-ask"
                        onClick={() => {
                          copyToClipboard(
                            `${getClientOrigin()}/content/${item?.contentId}`,
                          )
                          message.success(
                            t("knowledgeLibrary.archive.item.copyNotify"),
                          )
                        }}>
                        <IconShareExternal
                          style={{ fontSize: 14, color: "#64645F" }}
                        />
                        <span className="feed-list-item-text">
                          {t("knowledgeLibrary.archive.item.share")}
                        </span>
                      </span>
                    </IconTip>
                  </div>
                  {/* <div className="feed-item-action" style={{ marginTop: 8 }}>
                    <span
                      className="feed-item-topic"
                      key={1}
                      style={{
                        display: "inline-block",
                        borderRight: `1px solid #64645F`,
                        paddingRight: 12,
                        lineHeight: "10px",
                      }}>
                      <IconTag style={{ fontSize: 14, color: "#64645F" }} />
                      <span className="feed-list-item-text">
                        {item?.topic?.name}
                      </span>
                    </span>
                    <span
                      key={2}
                      className="feed-item-link"
                      onClick={() => {
                        window.open(item?.weblinks?.[0]?.url, "_blank")
                      }}>
                      <IconLink style={{ fontSize: 14, color: "#64645F" }} />
                      <span className="feed-list-item-text">
                        {safeParseURL(item?.weblinks?.[0]?.url)}{" "}
                        {item?.weblinks?.length - 1 > 0
                          ? `& ${t("knowledgeLibrary.archive.item.linkMore", { count: item?.weblinks?.length - 1 })}`
                          : ""}
                      </span>
                    </span>
                    <span key={3}>
                      <IconClockCircle
                        style={{ fontSize: 14, color: "#64645F" }}
                      />
                      <span className="feed-list-item-text">
                        {time(item.updatedAt, language as LOCALE)
                          .utc()
                          .fromNow()}
                      </span>
                    </span>
                  </div> */}
                </div>,
              ]}>
              <List.Item.Meta
                title={item.title}
                description={
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 2,
                      wrapper: "span",
                    }}
                    style={{ color: "rgba(0, 0, 0, .4) !important" }}>
                    {item.abstract}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  )
}
