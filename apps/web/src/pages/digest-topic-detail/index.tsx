import { useEffect, useState } from "react"

// 组件
import {
  List,
  Skeleton,
  Typography,
  Message as message,
  Breadcrumb,
} from "@arco-design/web-react"
import {
  IconClockCircle,
  IconLink,
  IconRightCircle,
  IconShareExternal,
  IconTag,
} from "@arco-design/web-react/icon"
import { Helmet } from "react-helmet"
import { time } from "@refly/ai-workspace-common/utils/time"
import { useNavigate, useParams } from "react-router-dom"
// stores
import { useDigestTopicDetailStore } from "@refly/ai-workspace-common/stores/digest-topic-detail"
// types
import { LOCALE } from "@refly/constants"
import { Digest } from "@refly/openapi-schema"
// request
import client from "@refly/ai-workspace-common/requests/proxiedRequest"
import { IconTip } from "@refly/ai-workspace-common/components/dashboard/icon-tip"
import { copyToClipboard } from "@refly/ai-workspace-common/utils"
import {
  getClientOrigin,
  safeParseURL,
} from "@refly/ai-workspace-common/utils/url"
import { useDigestTopicStore } from "@refly/ai-workspace-common/stores/digest-topics"
// styles
import "./index.scss"
// components
import { EmptyDigestTopicDetailStatus } from "@refly/ai-workspace-common/components/empty-digest-topic-detail-status"
// hooks
import { useGetDigestTopics } from "@refly/ai-workspace-common/hooks/use-get-digest-topics"
import { useTranslation } from "react-i18next"

const BreadcrumbItem = Breadcrumb.Item

export const DigestTopicDetail = () => {
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation></Skeleton>,
  )
  const digestTopicDetailStore = useDigestTopicDetailStore()
  const digestTopicStore = useDigestTopicStore()
  const navigate = useNavigate()
  const { digestTopicId } = useParams()
  const { fetchDigestTopicData, isFetching } = useGetDigestTopics()

  const { t, i18n } = useTranslation()
  const language = i18n.languages?.[0]

  // TODO: 替换成真正的 topic detail，目前还是 fake
  const currentTopicDetail = digestTopicStore.topicList?.find(
    item => String(item?.id) === String(digestTopicId),
  )

  const fetchData = async (currentPage = 1) => {
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

      console.log("currentPage", currentPage)
      if (!digestTopicDetailStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>{t("topicDetail.footer.noMoreText")}</span>)
        return
      }

      // TODO: digest 联调，currentTopicDetail?.key
      const { data: newRes, error } = await client.getDigestList({
        body: {
          page: currentPage,
          pageSize: 10,
          filter: { topic: currentTopicDetail?.topicKey }, // 带着 topic 的 filter
        },
      })

      if (error) {
        throw error
      }

      digestTopicDetailStore.updateCurrentPage(currentPage)

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }
      if (
        newRes?.data &&
        newRes?.data?.length < digestTopicDetailStore?.pageSize
      ) {
        digestTopicDetailStore.updateHasMore(false)
      }

      console.log("newRes", newRes)
      digestTopicDetailStore.updateTopicDigestList(newRes?.data || [])
    } catch (err) {
      message.error(t("topicDetail.list.fetchErr"))
    } finally {
      const { digestList, pageSize } = useDigestTopicDetailStore.getState()

      if (digestList?.length === 0) {
        setScrollLoading(
          <EmptyDigestTopicDetailStatus text={t("topicDetail.empty.title")} />,
        )
      } else if (digestList?.length > 0 && digestList?.length < pageSize) {
        setScrollLoading(<span>{t("topicDetail.footer.noMoreText")}</span>)
      }
    }
  }

  useEffect(() => {
    const len = digestTopicStore?.topicList?.length
    if (len === 0) {
      fetchDigestTopicData()
    } else if (len > 0) {
      fetchData()
    }

    return () => {
      digestTopicDetailStore.resetState()
    }
  }, [digestTopicStore?.topicList?.length])

  return (
    <div className="digest-topic-detail-container">
      <Helmet>
        {/* TODO: 国际化 这里需要根据用户语言返回对应的 i18n 的 topic title */}
        <title>
          {t("productName")} | {currentTopicDetail?.topic?.name || ""}
        </title>
      </Helmet>
      <div className="digest-topic-nav">
        <Breadcrumb>
          <BreadcrumbItem href="/">
            {t("topicDetail.breadcrumb.homePage")}
          </BreadcrumbItem>
          <BreadcrumbItem href="/digest/topics">
            {t("topicDetail.breadcrumb.allTopics")}
          </BreadcrumbItem>
          <BreadcrumbItem
            className="breadcrum-description"
            href={`/digest/topic/${currentTopicDetail?.id}`}>
            {currentTopicDetail?.topic?.name}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <List
        className="digest-list"
        wrapperStyle={{ width: "100%" }}
        bordered={false}
        pagination={false}
        offsetBottom={50}
        header={
          isFetching ? (
            <Skeleton animation></Skeleton>
          ) : (
            <div className="topics-header-container">
              <div className="topics-header-title">
                {currentTopicDetail?.topic?.name}
              </div>
              <p className="topics-header-desc">
                {currentTopicDetail?.topic?.description}
              </p>
            </div>
          )
        }
        dataSource={digestTopicDetailStore.digestList}
        scrollLoading={scrollLoading}
        onReachBottom={currentPage => fetchData(currentPage)}
        noDataElement={<div>{t("topicDetail.footer.noMoreText")}</div>}
        render={(item: Digest, index) => (
          <List.Item
            key={index}
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
                      navigate(`/digest/${item?.contentId}`)
                    }}>
                    <IconRightCircle
                      style={{ fontSize: 14, color: "#64645F" }}
                    />
                    <span className="feed-list-item-text">
                      {t("topicDetail.item.askFollow")}
                    </span>
                  </span>
                  <IconTip text={t("topicDetail.item.copy")}>
                    <span
                      key={1}
                      className="feed-list-item-continue-ask"
                      onClick={() => {
                        copyToClipboard(
                          `${getClientOrigin()}/content/${item?.cid}`,
                        )
                        message.success(t("topicDetail.item.copyNotify"))
                      }}>
                      <IconShareExternal
                        style={{ fontSize: 14, color: "#64645F" }}
                      />
                      <span className="feed-list-item-text">
                        {t("topicDetail.item.share")}
                      </span>
                    </span>
                  </IconTip>
                </div>
                {/* <div className="feed-item-action" style={{ marginTop: 8 }}>
                  <span
                    className="feed-item-topic"
                    key={3}
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
                    key={3}
                    className="feed-item-link"
                    onClick={() => {
                      window.open(item?.weblinks?.[0]?.url, "_blank")
                    }}>
                    <IconLink style={{ fontSize: 14, color: "#64645F" }} />
                    <span className="feed-list-item-text">
                      {safeParseURL(item?.weblinks?.[0]?.url)}{" "}
                      {item?.weblinks?.length - 1 > 0
                        ? `& ${t("topicDetail.item.linkMore", { count: item?.weblinks?.length - 1 })}`
                        : ""}
                    </span>
                  </span>
                  <span key={2}>
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
  )
}
