import { useParams } from "react-router-dom"
// components
/**
 * 只聚焦昨天、今天、这周、这个月最核心的内容，剩下的让用户去归档里面查看，能够对自己的工作有一个明确的感知
 */

import { time } from "@/utils/time"
import {
  List,
  Skeleton,
  Typography,
  Message as message,
  DatePicker,
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
import type { Digest, DateType } from "@/types/digest"
import { IconTip } from "@/components/dashboard/icon-tip"
import { copyToClipboard } from "@/utils"
import { getClientOrigin } from "@/utils/url"
// stores
import { useDigestArchiveStore } from "@/stores/digest-archive"
// components
import { DigestHeader } from "@/components/digest-common/header"
import { useEffect, useState } from "react"
import { EmptyDigestStatus } from "@/components/empty-digest-archive-status"
// utils
import getDigestList from "@/requests/getDigestList"
// styles
import "./index.scss"

export const DigestArchive = () => {
  const { dateType, year, month, day } = useParams()
  const [scrollLoading, setScrollLoading] = useState(<div></div>)
  const digestArchiveStore = useDigestArchiveStore()
  const navigate = useNavigate()

  const fetchData = async (currentPage = 1) => {
    try {
      setScrollLoading(
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            marginTop: 64,
          }}>
          <Skeleton animation style={{ width: "100%" }}></Skeleton>
          <Skeleton
            animation
            style={{ width: "100%", marginTop: 24 }}></Skeleton>
        </div>,
      )
      if (!digestArchiveStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>已经到底啦~</span>)
        return
      }

      // TODO: digest 联调，currentTopicDetail?.key
      const newRes = await getDigestList({
        body: {
          page: currentPage,
          pageSize: 10,
          filter: {
            date: {
              dateType: dateType as DateType,
              year: Number(year),
              month: Number(month),
              day: Number(day),
            },
          },
        },
      })

      digestArchiveStore.updateCurrentPage(currentPage)

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }
      if (newRes?.data && newRes?.data?.length < digestArchiveStore?.pageSize) {
        digestArchiveStore.updateHasMore(false)
      }

      console.log("newRes", newRes)
      digestArchiveStore.updateDigestList(newRes?.data || [])
    } catch (err) {
      message.error("获取归档内容失败，请重新刷新试试")
    } finally {
      const { digestList, pageSize } = useDigestArchiveStore.getState()

      if (digestList?.length === 0) {
        setScrollLoading(
          <EmptyDigestStatus
            date={{ year: year || "", month: month || "", day: day || "" }}
          />,
        )
      } else if (digestList?.length > 0 && digestList?.length < pageSize) {
        setScrollLoading(<span>已经到底啦~</span>)
      }
    }
  }

  useEffect(() => {
    fetchData()

    return () => {
      digestArchiveStore.resetState()
    }
  }, [dateType, day, year, month])

  return (
    <div className="digest-archive-container">
      <DigestHeader tab="archive" />
      {/* 现在选中的 archive 是：{dateType}/{year}/{month}/{day} */}
      <div className="archive-content-container">
        <List
          className="digest-list"
          wrapperStyle={{ width: "100%" }}
          bordered={false}
          pagination={false}
          offsetBottom={50}
          header={
            <div className="digest-archive-header">
              <div className="digest-archive-title">
                <p>
                  {year} 年 {month} 月 {day} 日内容精选
                </p>
              </div>
              <div className="digest-archive-time-picker">
                <DatePicker
                  popupVisible={digestArchiveStore.datePopupVisible}
                  onVisibleChange={visible =>
                    digestArchiveStore.updateDatePopupVisible(
                      visible as boolean,
                    )
                  }
                  defaultValue={`${year}-${Number(month) >= 10 ? month : `0${month}`}-${Number(day) >= 10 ? day : `0${day}`}`}
                  style={{ width: 200 }}
                  onChange={(dateStr, date) => {
                    const year = date.get("year")
                    const month = date.get("month")
                    const day = date.get("D")

                    console.log("day", day)

                    navigate(`/digest/daily/${year}/${month + 1}/${day}`)
                  }}
                />
              </div>
            </div>
          }
          dataSource={digestArchiveStore.digestList}
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
                        navigate(`/digest/${item?.contentId}`)
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
                            `${getClientOrigin()}/content/${item?.contentId}`,
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
                    <IconTip text="前往此分类">
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
                    </IconTip>
                    <span key={3}>
                      <IconLink style={{ fontSize: 14, color: "#64645F" }} />
                      <span className="feed-list-item-text">
                        {item?.weblinks?.[0]?.url} &{" "}
                        {item?.weblinks?.length - 1 > 0
                          ? `${item?.weblinks?.length - 1} 条更多`
                          : ""}
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
    </div>
  )
}
