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

const Header = () => {
  const siderStore = useSiderStore()

  return (
    <header>
      <div className="brand">
        <img src={Logo} alt="Refly" />
        <span>Refly</span>
      </div>
      <div className="funcs">
        <IconTip text="全屏">
          <img src={FullScreenSVG} alt="全屏" />
        </IconTip>
        <IconTip text="通知">
          <img src={NotificationSVG} alt="通知" />
        </IconTip>
        <IconTip text="设置">
          <img src={SettingGraySVG} alt="设置" />
        </IconTip>
        <IconTip text="账户">
          <Avatar size={16}>
            <img
              alt="avatar"
              src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
            />
          </Avatar>
        </IconTip>
        <IconTip text="关闭">
          <img
            src={CloseGraySVG}
            alt="关闭"
            onClick={() => siderStore.setShowSider(false)}
          />
        </IconTip>
      </div>
    </header>
  )
}

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
    }
  }

  useEffect(() => {
    fetchData()
  }, [isThreadLibrary])

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
        header={<p className="thread-library-title">会话库</p>}
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
            actionLayout="vertical"
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
