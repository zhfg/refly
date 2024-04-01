import { useDigestStore } from "@/stores/digest"
import {
  Button,
  Divider,
  Radio,
  Skeleton,
  Message as message,
} from "@arco-design/web-react"
import { IconArchive, IconBulb } from "@arco-design/web-react/icon"

import "./header.scss"
import { useNavigate } from "react-router-dom"
import { getCurrentDateInfo } from "@/utils/time"
import { useDigestTopicStore } from "@/stores/digest-topics"
import { useEffect, useState } from "react"
// request
import getTopicList from "@/requests/getTopicList"
// types
import { MetaRecord as Topic } from "@/types/"
// utils
import { delay } from "@/utils/delay"

interface DigestHeaderProps {
  tab: "today" | "archive"
}

export const DigestHeader = (props: DigestHeaderProps) => {
  const digestTopicStore = useDigestTopicStore()
  const navigate = useNavigate()
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation></Skeleton>,
  )
  // 获取内容中
  const [isFetching, setIsFetching] = useState(false)

  console.log("now tab", props.tab)

  const handleNavigateArchive = (item: "今天" | "归档") => {
    if (item === "今天") {
      navigate("/digest")
    } else if (item === "归档") {
      const { year, month, day } = getCurrentDateInfo()
      navigate(`/digest/daily/${year}/${month}/${day}`)
    }
  }

  // 只需要获取一页 topics 即可
  const fetchData = async (currentPage = 1) => {
    try {
      // 如果已经有 topics 了，就不再次获取
      const { topicList } = useDigestTopicStore.getState()
      if (topicList?.length > 0) return

      setIsFetching(true)
      await delay(3000)
      if (!digestTopicStore.hasMore && currentPage !== 1) {
        setScrollLoading(<span>已经到底啦</span>)

        return
      }

      const newRes = await getTopicList({
        body: {
          // TODO: confirm time filter
          page: currentPage,
          pageSize: digestTopicStore.pageSize,
        },
      })

      digestTopicStore.updateCurrentPage(currentPage)

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }
      if (
        newRes?.data &&
        newRes?.data?.list?.length < digestTopicStore.pageSize
      ) {
        digestTopicStore.updateHasMore(false)
      }

      console.log("newRes", newRes)
      digestTopicStore.updateTopicList(newRes?.data?.list as Topic[])
      digestTopicStore.updateTopicTotalCnt(newRes?.data?.total as number)
    } catch (err) {
      message.error("获取今日总结列表失败，请重新刷新试试")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="today-header-container">
      <div className="today-menu">
        <Radio.Group defaultValue={props.tab === "today" ? "今天" : "归档"}>
          {["今天", "归档"].map(item => {
            return (
              <Radio key={item} value={item}>
                {({ checked }) => {
                  return (
                    <Button
                      type="outline"
                      onClick={() =>
                        handleNavigateArchive(item as "今天" | "归档")
                      }
                      icon={item === "今天" ? <IconBulb /> : <IconArchive />}
                      className={`today-menu-item ${checked ? "today-menu-item-checked" : ""}`}>
                      {item}
                    </Button>
                  )
                }}
              </Radio>
            )
          })}
        </Radio.Group>
      </div>
      <Divider type="vertical" />
      <div className="trending-topic-container">
        <div className="trending-topic-title">趋势主题：</div>
        {isFetching ? (
          <div className="trending-topics">
            {Array(5)
              .fill(null)
              .map(item => (
                <Skeleton
                  key={item}
                  animation
                  text={{
                    rows: 1,
                    width: [100],
                    className: "custom-skeleton-node",
                  }}></Skeleton>
              ))}
          </div>
        ) : (
          <div className="trending-topics">
            {digestTopicStore.topicList?.map(item => (
              <div
                className="trending-topic-item"
                onClick={() => {
                  navigate(`/digest/topic/${item?.key}`)
                }}>
                <Button>{item?.name}</Button>
              </div>
            ))}
            {digestTopicStore?.topicList?.length > 0 && (
              <div className="trending-topic-item see-all">
                <Button onClick={() => navigate("/digest/topics")}>
                  查看全部+{32}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
