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
import { time } from "@/utils/time"
import { useMatch, useNavigate, useParams } from "react-router-dom"
// stores
import { useDigestTopicDetailStore } from "@/stores/digest-topic-detail"
// types
import { MetaRecord as Topic, Digest } from "@/types"
// request
import getTopicDigestList from "@/requests/getDigestList"
import { IconTip } from "@/components/dashboard/icon-tip"
import { copyToClipboard } from "@/utils"
import { getClientOrigin } from "@/utils/url"
import { useDigestTopicStore } from "@/stores/digest-topics"
// styles
import "./index.scss"
// fake data
import { fakeTopics } from "@/fake-data/digest"

const BreadcrumbItem = Breadcrumb.Item

export const DigestTopicDetail = () => {
  const [scrollLoading, setScrollLoading] = useState(<Skeleton></Skeleton>)
  const digestTopicDetailStore = useDigestTopicDetailStore()
  const digestTopicStore = useDigestTopicStore()
  const navigate = useNavigate()
  const isThreadLibrary = useMatch("/thread")
  const { digestTopicId } = useParams()

  // TODO: 替换成真正的 topic detail，目前还是 fake
  const currentTopicDetail =
    digestTopicStore.topicList?.find(item => item?.key === digestTopicId) ||
    fakeTopics?.[0]

  const fetchData = async (currentPage = 1) => {
    try {
      console.log("currentPage", currentPage)
      if (!digestTopicDetailStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>已经到底啦~</span>)
        return
      }

      // TODO: digest 联调，currentTopicDetail?.key
      const newRes = await getTopicDigestList({
        body: {
          page: currentPage,
          pageSize: 10,
          filter: { topicId: digestTopicId },
        },
      })

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
      message.error("获取会话列表失败，请重新刷新试试")
    }
  }

  useEffect(() => {
    fetchData()
  }, [isThreadLibrary])

  return (
    <div className="digest-topic-detail-container">
      <div className="digest-topic-nav">
        <Breadcrumb>
          <BreadcrumbItem href="/digest/topics">所有主题</BreadcrumbItem>
          <BreadcrumbItem href={`/digest/topic/${currentTopicDetail?.key}`}>
            {currentTopicDetail?.name}
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
          <div className="topics-header-container">
            <div className="topics-header-title">
              {currentTopicDetail?.name}
            </div>
            <p className="topics-header-desc"></p>
          </div>
        }
        dataSource={digestTopicDetailStore.digestList}
        scrollLoading={scrollLoading}
        onReachBottom={currentPage => fetchData(currentPage)}
        noDataElement={<div>暂无数据</div>}
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
                      navigate(`/feed/${item?.id}`)
                    }}>
                    <IconRightCircle
                      style={{ fontSize: 14, color: "#64645F" }}
                    />
                    <span className="feed-list-item-text">追问阅读</span>
                  </span>
                  <IconTip text="复制链接">
                    <span
                      key={1}
                      className="feed-list-item-continue-ask"
                      onClick={() => {
                        copyToClipboard(
                          `${getClientOrigin()}/digest/${item?.id}`,
                        )
                        message.success("链接已复制到剪切板")
                      }}>
                      <IconShareExternal
                        style={{ fontSize: 14, color: "#64645F" }}
                      />
                      <span className="feed-list-item-text">分享</span>
                    </span>
                  </IconTip>
                </div>
                <div className="feed-item-action" style={{ marginTop: 8 }}>
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
                      Developer Tools · Data Science
                    </span>
                  </span>
                  <span key={3}>
                    <IconLink style={{ fontSize: 14, color: "#64645F" }} />
                    <span className="feed-list-item-text">
                      {item?.source?.[0]?.metadata?.source} &{" "}
                      {item?.source?.length} 条更多
                    </span>
                  </span>
                  <span key={2}>
                    <IconClockCircle
                      style={{ fontSize: 14, color: "#64645F" }}
                    />
                    <span className="feed-list-item-text">
                      {time(item.updatedAt).utc().fromNow()}
                    </span>
                  </span>
                </div>
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
