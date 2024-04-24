import {
  List,
  Avatar,
  Skeleton,
  Message as message,
  Breadcrumb,
} from "@arco-design/web-react"

// styles
import "./index.scss"
import { IconTag } from "@arco-design/web-react/icon"
import { useEffect, useState } from "react"
// stores
import { useDigestTopicStore } from "@/stores/digest-topics"
import { useNavigate } from "react-router-dom"
// hooks
import { useGetDigestTopics } from "@/hooks/use-get-digest-topics"
// components
import { EmptyDigestTopicDetailStatus } from "@/components/empty-digest-topic-detail-status"
import { useTranslation } from "react-i18next"

const BreadcrumbItem = Breadcrumb.Item

export const DigestTopics = () => {
  const digestTopicStore = useDigestTopicStore()
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation></Skeleton>,
  )
  const navigate = useNavigate()
  const { fetchDigestTopicData } = useGetDigestTopics()

  const { t } = useTranslation()

  const fetchData = async (currentPage = 1) => {
    try {
      console.log("currentPage", currentPage)
      setScrollLoading(
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            gap: 40,
          }}>
          <Skeleton animation image style={{ width: 300 }}></Skeleton>
          <Skeleton animation image style={{ width: 300 }}></Skeleton>
          <Skeleton animation image style={{ width: 300 }}></Skeleton>
        </div>,
      )
      if (!digestTopicStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>{t("topics.footer.noMoreText")}</span>)
        return
      }

      await fetchDigestTopicData(currentPage)
    } catch (err) {
      message.error(t("topics.list.fetchErr"))
    } finally {
      const { topicList, pageSize } = useDigestTopicStore.getState()

      if (topicList?.length === 0) {
        setScrollLoading(
          <EmptyDigestTopicDetailStatus text={t("topics.empty.title")} />,
        )
      } else if (topicList?.length > 0 && topicList?.length < pageSize) {
        setScrollLoading(<span>{t("topics.footer.noMoreText")}</span>)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const dataSource = digestTopicStore?.topicList?.map(topic => ({
    id: topic?.id,
    index: topic?.id,
    avatar: topic?.topic?.name,
    title: topic?.topic?.name,
    description: topic?.topic?.description,
    imageSrc: topic?.topic?.name,
    sourceCount: topic?.topic?.count || 0,
  }))

  return (
    <div className="topics-container">
      <div className="digest-topic-nav">
        <Breadcrumb>
          <BreadcrumbItem href="/">
            {t("topics.breadcrumb.homePage")}
          </BreadcrumbItem>
          <BreadcrumbItem href="/digest/topics">
            {t("topics.breadcrumb.allTopics")}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <List
        className="topics-list"
        grid={{
          sm: 24,
          md: 12,
          lg: 8,
          xl: 6,
        }}
        dataSource={dataSource}
        wrapperStyle={{ width: "100%" }}
        bordered={false}
        pagination={false}
        offsetBottom={50}
        header={
          <div className="topics-header-container">
            <div className="topics-header-title">{t("topics.title")}</div>
            <p className="topics-header-desc">{t("topics.description")}</p>
          </div>
        }
        scrollLoading={scrollLoading}
        onReachBottom={currentPage => fetchData(currentPage)}
        noDataElement={<div>{t("topics.footer.noMoreText")}</div>}
        render={(item, index) => (
          <List.Item
            key={index}
            className="topic-item-container"
            onClick={() => navigate(`/digest/topic/${item?.id}`)}>
            <div className="topic-item">
              <div className="topic-item-left">
                <Avatar size={60} shape="square" style={{ color: "#000" }}>
                  {/* <img src={item.imageSrc} alt="topic-cover" />
                   */}
                  {item?.title?.[0]}
                </Avatar>
              </div>
              <div className="topic-item-right">
                <div className="topic-item-title">{item.title}</div>
                <div className="topic-item-desc">{item.description}</div>
                <div className="topic-item-source-cnt">
                  <IconTag />
                  <span>{item.sourceCount}</span>
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  )
}
