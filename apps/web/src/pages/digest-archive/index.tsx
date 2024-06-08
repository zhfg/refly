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
import { DigestHeader } from "@refly/ai-workspace-common/components/digest-common/header"
import { useEffect, useState } from "react"
import { EmptyDigestStatus } from "@refly/ai-workspace-common/components/empty-digest-today-status"
// utils
import getClient from "@refly/ai-workspace-common/requests/proxiedRequest"
// styles
import "./index.scss"
import { Source, Digest } from "@refly/openapi-schema"

export const getFirstSourceLink = (sources: Source[]) => {
  return sources?.[0]?.metadata?.source
}

export const DigestToday = () => {
  const navigate = useNavigate()
  const digestStore = useDigestStore()
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation style={{ width: "100%" }}></Skeleton>,
  )
  const [isFetching, setIsFetching] = useState(false)

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
        setScrollLoading(<span>已经到底啦</span>)

        return
      }

      const { data: newRes, error } = await getClient().getDigestList({
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
      newData = newRes?.data as Digest[]
      digestStore.updatePayload(
        { ...digestStore.today, featureList: newFeatureList },
        DigestType.TODAY,
      )
    } catch (err) {
      message.error("获取归档列表失败，请重新刷新试试")
    } finally {
      const { today } = useDigestStore.getState()

      console.log("newData", newData, today)
      if (today?.featureList?.length === 0) {
        setScrollLoading(<EmptyDigestStatus />)
      } else if (newData?.length >= 0 && newData?.length < today?.pageSize) {
        setScrollLoading(<span>已经到底啦~</span>)
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
      <DigestHeader tab="today" />
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
          header={<p className="today-header-title">浏览内容归档</p>}
          dataSource={digestStore?.today?.featureList || []}
          scrollLoading={scrollLoading}
          onReachBottom={currentPage => fetchData(currentPage)}
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
                          {item?.topicKey}
                        </span>
                      </span>
                    </IconTip>
                    {/* <span
                      key={3}
                      className="feed-item-link"
                      onClick={() => {
                        window.open(item?.weblinks?.[0]?.url, "_blank")
                      }}>
                      <IconLink style={{ fontSize: 14, color: "#64645F" }} />
                      <span className="feed-list-item-text">
                        {safeParseURL(item?.weblinks?.[0]?.url)}{" "}
                        {item?.weblinks?.length - 1 > 0
                          ? `& ${item?.weblinks?.length - 1} 条更多`
                          : ""}
                      </span>
                    </span> */}
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
