import { Markdown } from "@/components/markdown"
import { fakeKnowledgeResourceDetail } from "@/fake-data/knowledge-base"
import { IconBulb, IconCodepen } from "@arco-design/web-react/icon"

// 自定义样式
import "./index.scss"
import { useParams } from "react-router-dom"
import { Skeleton, Message as message } from "@arco-design/web-react"
import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
// 请求
import getResourceDetail from "@/requests/getResourceDetail"
// 类型
import { ResourceDetail } from "@/types"
import { useEffect, useState } from "react"
import { safeParseURL } from "@/utils/url"

export const KnowledgeBaseResourceDetail = () => {
  const params = useParams<{ resourceId: string }>()
  const [isFetching, setIsFetching] = useState(false)
  const knowledgeBaseStore = useKnowledgeBaseStore()

  const resourceDetail = knowledgeBaseStore?.currentResource as ResourceDetail

  const handleGetDetail = async (resourceId: string) => {
    setIsFetching(true)
    try {
      const newRes = await getResourceDetail({
        body: {
          resourceId,
        },
      })

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }

      console.log("newRes", newRes)
      knowledgeBaseStore.updateResource(newRes?.data as ResourceDetail)
    } catch (err) {
      message.error("获取内容详情失败，请重新刷新试试")
    }

    setIsFetching(false)
  }

  useEffect(() => {
    if (params?.resourceId) {
      console.log("params", params)
      handleGetDetail(params?.resourceId as string)
    }
  }, [params?.resourceId])

  return (
    <div className="knowledge-base-resource-detail-container">
      <div className="knowledge-base-resource-detail-body">
        {isFetching ? (
          <div style={{ margin: "20px auto" }}>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          </div>
        ) : (
          <div className="knowledge-base-resource-meta">
            <div className="knowledge-base-directory-site-intro">
              <div className="site-intro-icon">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${safeParseURL(resourceDetail?.data?.url as string)}&sz=${32}`}
                  alt={resourceDetail?.data?.url}
                />
              </div>
              <div className="site-intro-content">
                <p className="site-intro-site-name">
                  {resourceDetail?.data?.title}
                </p>
                <a
                  className="site-intro-site-url"
                  href={resourceDetail?.data?.url}
                  target="_blank">
                  {resourceDetail?.data?.url}
                </a>
              </div>
            </div>
            <div className="knowledge-base-directory-action">
              <div className="action-summary">
                <IconBulb />
                <span className="action-summary-text">AI Summary</span>
              </div>

              <div className="action-summary">
                <IconCodepen />
                <span className="action-summary-text">知识图谱</span>
              </div>
            </div>
            <div className="knowledge-base-directory-keyword-list">
              {(resourceDetail?.data?.keywords || []).map((keyword, index) => (
                <div
                  className="knowledge-base-directory-keyword-item"
                  key={index}>
                  <span>{keyword}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {isFetching ? (
          <div style={{ margin: "20px auto" }}>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          </div>
        ) : (
          <div className="knowledge-base-resource-content">
            <div className="knowledge-base-resource-content-title">
              {resourceDetail?.title}
            </div>
            <Markdown content={resourceDetail?.doc || ""}></Markdown>
          </div>
        )}
      </div>
    </div>
  )
}
