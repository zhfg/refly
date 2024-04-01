import React, { useEffect, useState } from "react"

// 组件
import {
  List,
  Skeleton,
  Message as message,
  Typography,
} from "@arco-design/web-react"
// stores
import { useFeedStore } from "@/stores/feed"
import { IconTip } from "@/components/dashboard/icon-tip"
import {
  IconBook,
  IconClockCircle,
  IconMessage,
  IconRightCircle,
  IconShareExternal,
  IconTag,
} from "@arco-design/web-react/icon"
import { useNavigate, useMatch } from "react-router-dom"
// utils
import { time } from "@/utils/time"
import getFeedList from "@/requests/getFeedList"
// types
import { Feed as IFeed } from "@/types"
import "./index.scss"
// fake data
import { copyToClipboard } from "@/utils"
import { getClientOrigin } from "@/utils/url"

export const Feed = () => {
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation></Skeleton>,
  )
  const feedStore = useFeedStore()
  const navigate = useNavigate()
  const isFeed = useMatch("/feed")

  const fetchData = async (currentPage = 1) => {
    try {
      console.log("currentPage", currentPage)
      if (!feedStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>已经到底啦~</span>)
        return
      }

      const newRes = await getFeedList({
        body: {
          page: currentPage,
          pageSize: 10,
        },
      })

      feedStore.updateCurrentPage(currentPage)

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }
      if (newRes?.data && newRes?.data?.length < feedStore?.pageSize) {
        feedStore.updateHasMore(false)
      }

      console.log("newRes", newRes)
      feedStore.updateFeedList(newRes?.data as IFeed[])
    } catch (err) {
      message.error("获取推荐内容失败，请重新刷新试试")
    }
  }

  useEffect(() => {
    fetchData()
  }, [isFeed])

  return (
    <div className="feed-container">
      {/* <Header /> */}
      <div className="feed-title-container">
        <p className="feed-title">
          <span>为你推荐</span>
        </p>
      </div>
      <List
        className="feed-list"
        wrapperStyle={{ width: "100%" }}
        bordered={false}
        pagination={false}
        offsetBottom={50}
        dataSource={feedStore?.feeds}
        scrollLoading={scrollLoading}
        onReachBottom={currentPage => fetchData(currentPage)}
        noDataElement={<div>暂无数据</div>}
        render={(item: IFeed, index) => (
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
                        copyToClipboard(`${getClientOrigin()}/feed/${item?.id}`)
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
                      {item?.meta?.topics?.map(item => item?.name).join(",")}
                    </span>
                  </span>
                  <span key={3}>
                    <IconBook style={{ fontSize: 14, color: "#64645F" }} />
                    <span className="feed-list-item-text">
                      {item?.readCount} 阅读
                    </span>
                  </span>
                  <span key={3}>
                    <IconMessage style={{ fontSize: 14, color: "#64645F" }} />
                    <span className="feed-list-item-text">
                      {item?.askFollow} 追问
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
