import {
  Divider,
  Drawer,
  Input,
  Modal,
  Tooltip,
  Table,
  type TableColumnProps,
  Button,
  Message as message,
  Typography
} from "@arco-design/web-react"
import { IconDelete, IconEdit } from "@arco-design/web-react/icon"
import styleText from "data-text:./index.scss"
import dayjs from "dayjs"
import type { PlasmoGetStyle } from "plasmo"
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import throttle from 'lodash.throttle'
import type { QueryPayload, WebLinkItem } from "./types"
import { defaultQueryPayload } from "./utils"

import { sendToBackground } from "@plasmohq/messaging"
import { useMessage } from "@plasmohq/messaging/hook"

import { type Conversation } from "~/types"
import { time } from "~utils/time"
// stores
import { useWeblinkStore } from '~stores/weblink'

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

type Props = {
  getPopupContainer: () => HTMLElement
}

const PreviosWebsiteList = forwardRef((props: Props, ref) => {
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const webLinkStore = useWeblinkStore();

  const loadMore = async (currentPage?: number) => {
    const { isRequest, hasMore, pageSize, ...extraState } = useWeblinkStore.getState();
    console.log('loadMore', isRequest, hasMore, pageSize, extraState)
    if (isRequest || !hasMore) return;

    // 获取数据
    const queryPayload = {
      pageSize,
      page: (typeof currentPage === 'number' ? currentPage : extraState.currentPage) + 1
    }

    // 更新页码
    webLinkStore.updateCurrentPage((typeof currentPage === 'number' ? currentPage : extraState.currentPage) + 1)
    webLinkStore.updateIsRequest(true);

    const res = await sendToBackground({
      name: "getWeblinkList",
      body: queryPayload,
    })

    if (!res?.success) {
      message.error('获取往期浏览内容识别！');
      webLinkStore.updateIsRequest(false);

      return;
    }

    // 处理分页
    if (res?.data?.length < pageSize) {
      webLinkStore.updateHasMore(false);
    }

    console.log("res", res)
    webLinkStore.updateWebLinkList(res?.data || [])
    webLinkStore.updateIsRequest(false);
  }

  //编辑
  const handleEdit = async (params: { id: string; title: string }) => {
    const res = await sendToBackground({
      name: "updateConversation",
      body: params,
    })
  }

  //删除
  const handleDelete = async (params: { id: string }) => {
    Modal.confirm({
      title: "确认删除会话！",
      style: {
        width: 340,
        height: 170,
      },
      content: "您确定要删除此对话吗？",
      okButtonProps: {
        status: "danger",
      },

      onOk: () => {
        return sendToBackground({
          name: "deleteConversation",
          body: params,
        })
      },
    })
  }

  const WebLinkItem = (props: { weblink: WebLinkItem }) => {
    const {
      id,
      title,
      updatedAt,
      originPageDescription,
      url = "",
      originPageTitle,
      originPageUrl,
    } = props?.weblink
    const urlItem = new URL(url || "")

    return (
      <div className="conv-item-wrapper">
        <div className="conv-item">
          <div className="conv-item-header">
            <span className="title">
              <div className="title-text">
                <Typography.Paragraph ellipsis={{ rows: 1, wrapper: 'span' }}>{originPageTitle}</Typography.Paragraph>
              </div>
            </span>
            {/* <Tooltip className="edit" content="编辑">
              <IconEdit />
            </Tooltip> */}
            <span className="date">{time(updatedAt).utc().fromNow()}</span>
          </div>
          <div className="conv-item-content">
            <span className="conv-item-content-text">
              <Typography.Paragraph ellipsis={{ rows: 1, wrapper: 'span' }}>{originPageDescription}</Typography.Paragraph>
            </span>
          </div>
          <div className="conv-item-footer">
            <div className="page-link">
              <a rel="noreferrer" href={originPageUrl} target="_blank">
                <img
                  className="icon"
                  src={`https://www.google.com/s2/favicons?domain=${urlItem.origin}&sz=${16}`}
                  alt=""
                />
                <span className="text">{originPageTitle}</span>
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

  const data = (webLinkStore?.webLinkList || []).map((item, key) => ({
    key,
    content: item,
  }))

  const columns: TableColumnProps[] = [
    {
      key: "0",
      dataIndex: "content",
      title: "content",
      render: (col, record, index) => (
        <WebLinkItem weblink={record?.content} key={index} />
      ),
    },
  ]

  // 节流的处理
  const handleScroll = throttle((event: React.UIEvent<HTMLElement, UIEvent>) => {
    const { webLinkList, } = useWeblinkStore.getState();

    // 获取列表的滚动高度，以及现在的列表数量，当还存在 2 个时触发滚动
    const scrollTopElem = document
      .querySelector("plasmo-csui")
      ?.shadowRoot?.querySelector(".conv-list")?.querySelector('.arco-table-body');

    if (!scrollTopElem || webLinkList?.length < 10) return;
    const scrollTop = scrollTopElem?.scrollTop || 0;
    const scrollHeight = scrollTopElem?.scrollHeight || 0;
    const clientHeight = scrollTopElem?.clientHeight;

    console.log('clientHeight', scrollTop, clientHeight, scrollHeight)
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadMore();
    }
  }, 500)

  useEffect(() => {
    loadMore(0)
  }, [webLinkStore?.isWebLinkListVisible])

  return (
    <div style={{ width: "100%" }}>
      <Drawer
        getPopupContainer={props.getPopupContainer}
        width="100%"
        style={{
          maxHeight: 680,
          height: "80%",
          zIndex: 66,
        }}
        headerStyle={{ justifyContent: "center" }}
        title={
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ fontWeight: "bold" }}>网页浏览历史</span>
          </div>
        }
        visible={webLinkStore.isWebLinkListVisible}
        placement="bottom"
        footer={<div className="weblink-footer-container">
          <p className="weblink-footer-selected">已选择 <span>{selectedRowKeys?.length}</span> 项</p>
          <div>
            <Button onClick={() => {
              webLinkStore.updateIsWebLinkListVisible(false);
            }} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" onClick={() => {

            }}>确认</Button>
          </div>
        </div>}
        onOk={() => {
          webLinkStore.updateIsWebLinkListVisible(false)
        }}
        onCancel={() => {
          webLinkStore.updateIsWebLinkListVisible(false)
        }}>
        {/* <Input placeholder="搜索" /> */}
        {/* <div className="conv-list"> */}
        {/* {weblinkList.map((weblink, index) => (
            <WebLinkItem weblink={weblink} key={index} />
          ))} */}

        {/* </div> */}
        <Table
          className="conv-list"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
              console.log('selectedRowKeys', selectedRowKeys);
              console.log('selectedRows', selectedRows);
              setSelectedRowKeys(selectedRowKeys);
            },
          }}
          virtualListProps={{
            itemHeight: 100,
            onScroll(event) {
              handleScroll(event);
            }
          }}
          scroll={{
            y: 600
          }}
          virtualized={true}
          pagination={false}
          columns={columns}
          data={data}
          border={false}
          showHeader={false}
        />
      </Drawer>
    </div>
  )
})

export default PreviosWebsiteList
