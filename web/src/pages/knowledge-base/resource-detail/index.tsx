import { Markdown } from "@/components/markdown"
import { fakeKnowledgeResourceDetail } from "@/fake-data/knowledge-base"
import { IconBulb, IconCodepen } from "@arco-design/web-react/icon"

// 自定义样式
import "./index.scss"

export const KnowledgeBaseResourceDetail = () => {
  const resourceDetail = fakeKnowledgeResourceDetail

  return (
    <div className="knowledge-base-resource-detail-container">
      <div className="knowledge-base-resource-detail-body">
        <div className="knowledge-base-resource-meta">
          <div className="knowledge-base-directory-site-intro">
            <div className="site-intro-icon">
              <img
                src={`https://www.google.com/s2/favicons?domain=${resourceDetail?.meta?.origin}&sz=${32}`}
                alt={resourceDetail?.meta?.origin}
              />
            </div>
            <div className="site-intro-content">
              <p className="site-intro-site-name">
                {resourceDetail?.meta.siteName}
              </p>
              <a
                className="site-intro-site-url"
                href={resourceDetail?.meta.url}
                target="_blank">
                {resourceDetail?.meta.url}
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
            {resourceDetail?.meta.keywords.map((keyword, index) => (
              <div
                className="knowledge-base-directory-keyword-item"
                key={index}>
                <span>{keyword}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="knowledge-base-resource-content">
          <div className="knowledge-base-resource-content-title">
            {resourceDetail?.meta.title}
          </div>
          <Markdown content={resourceDetail?.content}></Markdown>
        </div>
      </div>
    </div>
  )
}
