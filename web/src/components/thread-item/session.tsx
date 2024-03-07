import { Button, List, Skeleton, Typography } from "@arco-design/web-react"
import {
  IconCopy,
  IconPlus,
  IconQuote,
  IconReply,
  IconTranslate,
} from "@arco-design/web-react/icon"
import React, { useState } from "react"
import type { SessionItem } from "@/types"

// stores
import { useMessageStateStore } from "@/stores/message-state"
import { IconTip } from "@/components/home/icon-tip"
import { Markdown } from "@/components/markdown"

import copyToClipboard from "copy-to-clipboard"

interface SessionProps {
  session: SessionItem
  isLastSession: boolean
}

export const Session = (props: SessionProps) => {
  const { session, isLastSession = false } = props
  const messageStateStore = useMessageStateStore()
  const [scrollLoading] = useState(<Skeleton></Skeleton>)

  //   const fetchData = currentPage => {}

  // console.log('session', isLastSession, session)

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
              <p>答案</p>
            </div>
            {session?.answer ? (
              <>
                <p className="session-answer">
                  <Markdown content={session?.answer} />
                </p>
                {!messageStateStore?.pending && (
                  <div className="session-answer-actionbar">
                    <div className="session-answer-actionbar-left">
                      {/* <IconTip text='复制链接'><Button type='text' icon={<IconShareInternal style={{ fontSize: 14 }} />} style={{ color: '#64645F' }}>分享</Button></IconTip> */}
                      {/* <IconTip text="重新生成答案"><Button type='text' icon={<IconPalette style={{ fontSize: 14 }} />} style={{ color: '#64645F' }}>重写</Button></IconTip> */}
                    </div>
                    <div className="session-answer-actionbar-right">
                      <IconTip text="复制此答案">
                        <Button
                          type="text"
                          shape="circle"
                          icon={<IconCopy style={{ fontSize: 14 }} />}
                          style={{ color: "#64645F" }}
                          onClick={() =>
                            copyToClipboard(session?.answer)
                          }></Button>
                      </IconTip>
                      {/* <IconTip text='点踩'><Button type='text' shape='circle' icon={<IconNotificationClose style={{ fontSize: 14 }} />} style={{ color: '#64645F' }}></Button></IconTip> */}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Skeleton></Skeleton>
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
        <div className="session-title-icon">
          <IconQuote style={{ fontSize: 18 }} />
          <p>来源</p>
        </div>
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
                            · {new URL(item.metadata?.source as "")?.origin} ·
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
        ) : (
          <Skeleton></Skeleton>
        )}
      </div>
    </div>
  )
}
