import { Divider, Drawer, Input, Modal, Tooltip } from "@arco-design/web-react"
import { IconDelete, IconEdit } from "@arco-design/web-react/icon"
import styleText from "data-text:./index.scss"
import dayjs from "dayjs"
import type { PlasmoGetStyle } from "plasmo"
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"

import { sendToBackground } from "@plasmohq/messaging"
import { useMessage } from "@plasmohq/messaging/hook"

import { type Conversation } from "~/types"
import { time } from "~utils/time"

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

type Props = {
  getPopupContainer: () => HTMLElement
}

const PreviosWebsiteList = forwardRef((props: Props, ref) => {
  const [visible, setVisible] = useState<boolean>()
  const [conversationList, setConversationList] = useState<Conversation[]>([])
  const [keyword, setKeyword] = useState("")
  const currentPage = useRef(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleGetConversationList = async () => {
    const res = await sendToBackground({
      name: "getConversationList",
      body: {
        page: currentPage.current
      }
    })

    setConversationList(res.data.data)
  }

  //编辑
  const handleEdit = async (params: { id: string; title: string }) => {
    const res = await sendToBackground({
      name: "updateConversation",
      body: params
    })
  }

  //删除
  const handleDelete = async (params: { id: string }) => {
    Modal.confirm({
      title: "确认删除会话！",
      style: {
        width: 340,
        height: 170
      },
      content: "您确定要删除此对话吗？",
      okButtonProps: {
        status: "danger"
      },

      onOk: () => {
        return sendToBackground({
          name: "deleteConversation",
          body: params
        })
      }
    })
  }

  useImperativeHandle(
    ref,
    () => {
      return {
        setVisible(incomingVisible: boolean) {
          setVisible(incomingVisible)
          if (incomingVisible) {
            // handleGetConversationList()
          }
        },

        setConversationList(conversationList) {
          setConversationList(conversationList)
        },

        getConversationList() {
          return conversationList
        },

        hasConversation(conversationId: string) {
          return (
            conversationList.filter(
              (item) => item.conversationId === conversationId
            )?.length > 0
          )
        }
      }
    },
    [conversationList, visible]
  )

  const ConversationItem = (props: { conversation: Conversation }) => {
    const { id, title, updatedAt, origin, originPageTitle, lastMessage } =
      props?.conversation

    return (
      <div className="conv-item-wrapper">
        <div className="conv-item">
          <div className="conv-item-header">
            <span className="title">
              <div className="title-text">{title}</div>
            </span>
            <Tooltip className="edit" content="编辑">
              <IconEdit />
            </Tooltip>
            <span className="date">{time(updatedAt).utc().fromNow()}</span>
          </div>
          <div className="conv-item-content">
            <span className="conv-item-content-text">{lastMessage}</span>
          </div>
          <div className="conv-item-footer">
            <div className="page-link">
              <a
                rel="noreferrer"
                onClick={() => {
                  chrome.tabs.create({
                    url: origin
                  })
                }}>
                <img
                  className="icon"
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${origin}`}
                  alt=""
                />
                <span className="text">{originPageTitle}</span>
              </a>
            </div>
            <Tooltip className="delete" content="删除会话">
              <IconDelete
                onClick={() => {
                  console.log("handleDelete", handleDelete)
                  handleDelete({
                    id
                  })
                }}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: "100%" }}>
      <Drawer
        getPopupContainer={props.getPopupContainer}
        width="100%"
        style={{
          maxHeight: 680,
          height: "80%",
          zIndex: 66
        }}
        headerStyle={{ justifyContent: "center" }}
        title={
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ fontWeight: "bold" }}>会话历史记录</span>
          </div>
        }
        visible={visible}
        placement="bottom"
        footer={null}
        onOk={() => {
          setVisible(false)
        }}
        onCancel={() => {
          setVisible(false)
        }}>
        <Input placeholder="搜索" />
        <div className="conv-list">
          {conversationList.map((conv, index) => (
            <ConversationItem conversation={conv} key={index} />
          ))}
        </div>
      </Drawer>
    </div>
  )
})

export default PreviosWebsiteList
