import {
  Button,
  List,
  Skeleton,
  Typography,
  Message as message,
} from "@arco-design/web-react"
import {
  IconBulb,
  IconCopy,
  IconPlus,
  IconQuote,
  IconReply,
  IconTranslate,
} from "@arco-design/web-react/icon"
import React, { useState } from "react"
import type { SessionItem, Source } from "@/types"

// stores
import { useMessageStateStore } from "@/stores/message-state"
import { IconTip } from "@/components/dashboard/icon-tip"
import { Markdown } from "@/components/markdown"
// components
import { SummaryModal } from "@/components/summary-modal"
// request
import getSourceSummary from "@/requests/getSourceSummary"

import copyToClipboard from "copy-to-clipboard"
import { delay } from "@/utils/delay"
// fake data
import { fakeSourceSummary } from "@/fake-data/source"
import { safeParseURL } from "@/utils/url"

interface SessionProps {
  session: SessionItem
  isLastSession: boolean
}

export const Session = (props: SessionProps) => {
  const { session, isLastSession = false } = props
  const messageStateStore = useMessageStateStore()
  const [scrollLoading] = useState(<Skeleton animation></Skeleton>)

  // summary source logic
  const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false)
  const [selectedSummarySource, setSelectedSummarySource] = useState<Source>()

  // method to get source summary
  const getDetail = async (id: string) => {
    await delay(3000)

    // 目前先暂时显示 fake 数据
    return selectedSummarySource?.pageContent
    const res = await getSourceSummary({
      body: {
        sourceId: id,
      },
    })

    if (!res?.success) {
      throw new Error("获取总结详情失败")
    }

    return res?.data
  }
  //   const fetchData = currentPage => {}

  return (
    <div className="session-item-container">
      <div className="session-content-body">
        <div className="session-item">
          <div>
            <p className="session-question">{session?.question}</p>
          </div>
          <div className="session-answer">
            <div className="session-title-icon">
              <IconTranslate style={{ fontSize: 18 }} />
              <p>正文内容</p>
            </div>
            {session?.answer ? (
              <>
                <div className="session-answer">
                  <Markdown content={session?.answer} />
                </div>
                {!messageStateStore?.pending && (
                  <div className="session-answer-actionbar">
                    <div className="session-answer-actionbar-left">
                      {/* <IconTip text="复制链接">
                        <Button
                          type="text"
                          icon={<IconShareInternal style={{ fontSize: 14 }} />}
                          onClick={() => {
                            copyToClipboard(location.href)
                            message.success("复制成功")
                          }}
                          style={{ color: "#64645F" }}>
                          分享
                        </Button>
                      </IconTip> */}
                      {/* <IconTip text="重新生成答案"><Button type='text' icon={<IconPalette style={{ fontSize: 14 }} />} style={{ color: '#64645F' }}>重写</Button></IconTip> */}
                    </div>
                    <div className="session-answer-actionbar-right">
                      <IconTip text="复制内容">
                        <Button
                          type="text"
                          shape="circle"
                          icon={<IconCopy style={{ fontSize: 14 }} />}
                          style={{ color: "#64645F" }}
                          onClick={() => {
                            copyToClipboard(session?.answer)
                            message.success("复制成功")
                          }}></Button>
                      </IconTip>
                      {/* <IconTip text="复制此答案">
                        <Button
                          type="text"
                          shape="circle"
                          icon={<IconCopy style={{ fontSize: 14 }} />}
                          style={{ color: "#64645F" }}
                          onClick={() =>
                            copyToClipboard(session?.answer)
                          }></Button>
                      </IconTip> */}
                      {/* <IconTip text='点踩'><Button type='text' shape='circle' icon={<IconNotificationClose style={{ fontSize: 14 }} />} style={{ color: '#64645F' }}></Button></IconTip> */}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Skeleton animation></Skeleton>
            )}
          </div>
        </div>
        {session?.relatedQuestions?.length > 0 && isLastSession && (
          <div className="session-related-question">
            <div className="session-title-icon">
              <IconReply style={{ fontSize: 18 }} />
              <p>相关问题</p>
            </div>
            <div className="session-related-question-content">
              {session?.relatedQuestions?.map((item, index) => (
                <div key={index}>
                  <p>{item}</p>
                  <IconPlus
                    style={{ fontSize: 12, color: "rgba(0,0,0,0.60)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="session-source">
        {messageStateStore.pending || session?.sources?.length > 0 ? (
          <div className="session-title-icon">
            <IconQuote style={{ fontSize: 18, color: "rgba(0, 0, 0, .8)" }} />
            <p>来源</p>
          </div>
        ) : null}
        {session?.sources?.length > 0 ? (
          <div className="session-source-content">
            <div className="session-source-list">
              <List
                className="session-source-list-item"
                wrapperStyle={{ width: "100%" }}
                bordered={false}
                pagination={{}}
                dataSource={session?.sources}
                scrollLoading={
                  session?.sources?.length > 0 ? null : scrollLoading
                }
                noDataElement={<div>暂无数据</div>}
                render={(item, index) => (
                  <List.Item
                    key={index}
                    style={{
                      borderBottom: "0.5px solid var(--color-fill-3)",
                    }}
                    actionLayout="vertical"
                    extra={
                      <div className="session-source-extra">
                        <IconTip text="查看此网页的总结">
                          <span
                            key={1}
                            className="feed-list-item-continue-ask with-border with-hover"
                            onClick={() => {
                              setSelectedSummarySource(item)
                              setIsSummaryModalVisible(true)
                            }}>
                            <IconBulb
                              style={{ fontSize: 14, color: "#64645F" }}
                            />
                            <span className="feed-list-item-text">总结</span>
                          </span>
                        </IconTip>
                      </div>
                    }
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
                        <span
                          key={2}
                          className="session-source-list-item-action">
                          <Typography.Paragraph
                            ellipsis={{ rows: 1, wrapper: "span" }}
                            style={{
                              fontSize: 10,
                              color: "rgba(0, 0, 0, .4)",
                            }}>
                            · {safeParseURL(item.metadata?.source || "")} ·
                          </Typography.Paragraph>
                        </span>
                      </a>,
                      <span
                        key={2}
                        className="session-source-list-item-action"
                        style={{ fontSize: 10, color: "rgba(0, 0, 0, .4)" }}>
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
                            width: 600,
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
        ) : messageStateStore?.pending && isLastSession ? (
          <Skeleton animation></Skeleton>
        ) : null}
      </div>
      {isSummaryModalVisible ? (
        <SummaryModal
          getDetail={getDetail}
          id={selectedSummarySource?.metadata?.source as string}
          visible={isSummaryModalVisible}
          setVisible={visible => setIsSummaryModalVisible(visible)}
        />
      ) : null}
    </div>
  )
}
