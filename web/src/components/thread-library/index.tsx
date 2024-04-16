import React, { useEffect, useState } from "react"

// 静态资源
import Logo from "@/assets/logo.svg"
import CloseGraySVG from "@/assets/side/close.svg"
import NotificationSVG from "@/assets/side/notification.svg"
import SettingGraySVG from "@/assets/side/setting.svg"
import FullScreenSVG from "@/assets/side/full-screen.svg"

// 组件
import {
  Avatar,
  List,
  Skeleton,
  Message as message,
  Typography,
} from "@arco-design/web-react"
// stores
import { useSiderStore } from "@/stores/sider"
import { useThreadStore } from "@/stores/thread"
import { IconTip } from "@/components/dashboard/icon-tip"
import {
  IconClockCircle,
  IconMessage,
  IconRightCircle,
} from "@arco-design/web-react/icon"
import { useNavigate, useMatch } from "react-router-dom"
// utils
import { time } from "@/utils/time"
import getConversationList from "@/requests/getConversationList"
// types
import { Thread } from "@/types"
import "./index.scss"
import { delay } from "@/utils/delay"
// components
import { EmptyThreadLibraryStatus } from "@/components/empty-thread-library-status"

export const ThreadLibrary = () => {
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation></Skeleton>,
  )
  const threadStore = useThreadStore()
  const navigate = useNavigate()
  const isThreadLibrary = useMatch("/thread")

  const fetchData = async (currentPage = 1) => {
    try {
      console.log("currentPage", currentPage)
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

      if (!threadStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>已经到底啦~</span>)
        return
      }

      const newRes = await getConversationList({
        body: {
          page: currentPage,
          pageSize: 10,
        },
      })

      threadStore.updateCurrentPage(currentPage)

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }
      if (newRes?.data && newRes?.data?.length < threadStore?.pageSize) {
        threadStore.updateHasMore(false)
      }

      console.log("newRes", newRes)
      threadStore.updateThreadList(newRes?.data || [])
    } catch (err) {
      message.error("获取会话列表失败，请重新刷新试试")
    } finally {
      const { threads, pageSize } = useThreadStore.getState()

      if (threads?.length === 0) {
        setScrollLoading(<EmptyThreadLibraryStatus />)
      } else if (threads?.length > 0 && threads?.length < pageSize) {
        setScrollLoading(<span>已经到底啦~</span>)
      }
    }
  }

  useEffect(() => {
    fetchData()

    return () => {
      threadStore.resetState()
    }
  }, [])

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      {/* <Header /> */}
      <List
        className="thread-library-list"
        wrapperStyle={{ width: "100%" }}
        bordered={false}
        header={
          <div className="feed-title-container">
            <p className="feed-title">
              <span>会话库</span>
            </p>
          </div>
        }
        pagination={false}
        offsetBottom={50}
        dataSource={threadStore?.threads}
        scrollLoading={scrollLoading}
        onReachBottom={currentPage => fetchData(currentPage)}
        noDataElement={<div>暂无数据</div>}
        render={(item: Thread, index) => (
          <List.Item
            key={index}
            style={{
              padding: "20px 0",
              borderBottom: "1px solid var(--color-fill-3)",
            }}
            className="thread-library-list-item"
            actionLayout="vertical"
            onClick={() => {
              navigate(`/thread/${item?.id}`)
            }}
            actions={[
              <span
                key={1}
                className="thread-library-list-item-continue-ask with-border with-hover"
                onClick={() => {
                  navigate(`/thread/${item?.id}`)
                }}>
                <IconRightCircle style={{ fontSize: 14, color: "#64645F" }} />
                <span className="thread-library-list-item-text">继续提问</span>
              </span>,
              <span key={2}>
                <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
                <span className="thread-library-list-item-text">
                  {time(item.updatedAt).utc().fromNow()}
                </span>
              </span>,
              <span key={3}>
                <IconMessage style={{ fontSize: 14, color: "#64645F" }} />
                <span className="thread-library-list-item-text">
                  {item?.messageCount} 条消息
                </span>
              </span>,
            ]}>
            <List.Item.Meta
              title={item.title}
              description={
                <Typography.Paragraph
                  ellipsis={{ rows: 2, wrapper: "span" }}
                  style={{ color: "rgba(0, 0, 0, .4) !important" }}>
                  {item.lastMessage}
                </Typography.Paragraph>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}
