import { Divider, Drawer, Input, Modal, Tooltip } from "@arco-design/web-react"
import { IconDelete, IconEdit } from "@arco-design/web-react/icon"
import styleText from "data-text:./index.scss"
import dayjs from "dayjs"
import type { PlasmoGetStyle } from "plasmo"
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import type { QueryPayload, WebLinkItem } from './types'
import { defaultQueryPayload } from './utils';

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
  const [visible, setVisible] = useState<boolean>(false)
  const [weblinkList, setWeblinkList] = useState<WebLinkItem[]>([])
  const [keyword, setKeyword] = useState("")
  const queryPayloadRef = useRef(defaultQueryPayload)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const getWebLinkList = async (queryPayload: QueryPayload) => {
    console.log('queryPayload', queryPayload)
    const res = await sendToBackground({
      name: 'getWeblinkList',
      body: queryPayload,
    })

    console.log('res', res)
    setWeblinkList(res.data || []);
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
            // 获取 link 列表
            getWebLinkList(queryPayloadRef.current);
          }
        },

        setWeblinkList(weblinkList) {
          setWeblinkList(weblinkList)
        },

        getWeblinkList() {
          return weblinkList
        },

        hasWeblink(urlOrLinkId: string) {
          return (
            weblinkList.filter(
              (item) => item.url === urlOrLinkId || item.linkId === urlOrLinkId
            )?.length > 0
          )
        }
      }
    },
    [weblinkList, visible]
  )

  const WebLinkItem = (props: { weblink: WebLinkItem }) => {
    const { id, title, updatedAt, description, url = ''  } =
      props?.weblink
    const urlItem = new URL(url);

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
            <span className="conv-item-content-text">{description}</span>
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
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${urlItem.origin}`}
                  alt=""
                />
                <span className="text">{title}</span>
              </a>
            </div>
            {/** 第一版本不允许删除 */}
            {/* <Tooltip className="delete" content="删除网页">
              <IconDelete
                onClick={() => {
                  console.log("handleDelete", handleDelete)
                  handleDelete({
                    id
                  })
                }}
              />
            </Tooltip> */}
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
            <span style={{ fontWeight: "bold" }}>网页历史</span>
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
          {weblinkList.map((weblink, index) => (
            <WebLinkItem weblink={weblink} key={index} />
          ))}
        </div>
      </Drawer>
    </div>
  )
})

export default PreviosWebsiteList
