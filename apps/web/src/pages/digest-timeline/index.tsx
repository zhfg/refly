import { useSearchParams } from "react-router-dom"
// components
/**
 * 只聚焦昨天、今天、这周、这个月最核心的内容，剩下的让用户去归档里面查看，能够对自己的工作有一个明确的感知
 */

import { time } from "@refly/ai-workspace-common/utils/time"
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
import type { Digest, DateType } from "@refly/ai-workspace-common/types/digest"
import { IconTip } from "@refly/ai-workspace-common/components/dashboard/icon-tip"
import { copyToClipboard } from "@refly/ai-workspace-common/utils"
import {
  getClientOrigin,
  safeParseURL,
} from "@refly/ai-workspace-common/utils/url"
// stores
import { useDigestArchiveStore } from "@refly/ai-workspace-common/stores/digest-archive"
// components
import { DigestHeader } from "@refly/ai-workspace-common/components/digest-common/header"
import { useEffect, useState } from "react"
import { EmptyDigestStatus } from "@refly/ai-workspace-common/components/empty-digest-archive-status"
// utils
import getDigestList from "@refly/ai-workspace-common/requests/getDigestList"
// styles
import "./index.scss"
import { useTranslation } from "react-i18next"
import { LOCALE } from "@refly/ai-workspace-common/types"

export const DigestArchive = () => {
  const [searchParams] = useSearchParams()
  const [scrollLoading, setScrollLoading] = useState(<div></div>)
  const digestArchiveStore = useDigestArchiveStore()
  const navigate = useNavigate()

  const dateType = searchParams.get("dateType")
  const year = searchParams.get("y")
  const month = searchParams.get("m")
  const day = searchParams.get("d")

  const { t, i18n } = useTranslation()
  const language = i18n.languages?.[0]

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
      if (!digestArchiveStore?.hasMore && currentPage !== 1) {
        setScrollLoading(
          <span>{t("knowledgeLibrary.archive.item.noMoreText")}</span>,
        )
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
      message.error(t("knowledgeLibrary.timeline.list.fetchErr"))
    } finally {
      const { digestList, pageSize } = useDigestArchiveStore.getState()

      if (digestList?.length === 0) {
        setScrollLoading(
          <EmptyDigestStatus
            date={{ year: year || "", month: month || "", day: day || "" }}
          />,
        )
      } else if (digestList?.length > 0 && digestList?.length < pageSize) {
        setScrollLoading(
          <span>{t("knowledgeLibrary.archive.item.noMoreText")}</span>,
        )
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
                  {t("knowledgeLibrary.timeline.title", { year, month, day })}
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

                    navigate(
                      `/?type=timeline&dateType=daily&y=${year}&m=${month + 1}&d=${day}`,
                    )
                  }}
                />
              </div>
            </div>
          }
          dataSource={digestArchiveStore.digestList}
          scrollLoading={scrollLoading}
          onReachBottom={currentPage => fetchData(currentPage)}
          noDataElement={
            <div>{t("knowledgeLibrary.archive.item.noMoreText")}</div>
          }
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
                          ? `& ${t("knowledgeLibrary.archive.item.linkMore", { count: item?.weblinks?.length - 1 })}`
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
