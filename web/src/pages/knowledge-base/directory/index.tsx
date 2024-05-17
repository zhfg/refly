import {
  fakeKnowledgeBaseDetail,
  fakeKnowledgeBaseDirectoryList,
} from "@/fake-data/knowledge-base"
import { LOCALE } from "@/types"
import { time } from "@/utils/time"

// styles
import "./index.scss"
import {
  IconBook,
  IconBulb,
  IconCompass,
  IconFile,
  IconMore,
  IconSearch,
} from "@arco-design/web-react/icon"
import { Divider, Input } from "@arco-design/web-react"
import { useSearchableList } from "@/components/use-searchable-list"
import { useEffect, useState } from "react"
import type { Resource } from "@/types/knowledge-base"

export const KnowledgeBaseDirectory = () => {
  const [searchVal, setSearchVal] = useState("")
  const [directoryList, setDirectoryList, filter] = useSearchableList<Resource>(
    "title",
    {
      debounce: true,
      delay: 300,
    },
  )

  const handleChange = (val: string) => {
    filter(val)
    setSearchVal(val)
  }

  useEffect(() => {
    setDirectoryList(fakeKnowledgeBaseDirectoryList)
  }, [])

  return (
    <div className="knowledge-base-directory-container">
      <div className="knowledge-base-directory-intro">
        <div className="intro-body">
          <div className="intro-icon">
            <IconFile style={{ fontSize: 28, color: "rgba(0, 0, 0, .5)" }} />
          </div>
          <div className="intro-content">
            <div className="intro-title">{fakeKnowledgeBaseDetail?.name}</div>
            <div className="intro-meta">
              <span>
                {time(fakeKnowledgeBaseDetail?.updatedAt, LOCALE.EN)
                  .utc()
                  .fromNow()}
              </span>
              {" · "}
              <span>{fakeKnowledgeBaseDetail?.count} 个内容</span>
            </div>
          </div>
        </div>
        <div className="intro-menu">
          <IconMore />
        </div>
      </div>
      <div className="knowledge-base-directory-search-container">
        <Input
          placeholder="搜索知识库..."
          allowClear
          className="knowledge-base-directory-search"
          style={{ height: 32, borderRadius: "8px" }}
          value={searchVal}
          prefix={<IconSearch />}
          onChange={handleChange}
        />
        <Divider />
      </div>
      <div className="knowledge-base-directory-list">
        {directoryList.map((item, index) => (
          <div className="knowledge-base-directory-item" key={index}>
            <div className="knowledge-base-directory-site-intro">
              <div className="site-intro-icon">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item?.origin}&sz=${32}`}
                  alt={item?.origin}
                />
              </div>
              <div className="site-intro-content">
                <p className="site-intro-site-name">{item.siteName}</p>
                <a
                  className="site-intro-site-url"
                  href={item.url}
                  target="_blank">
                  {item.url}
                </a>
              </div>
            </div>
            <div className="knowledge-base-directory-title">{item.title}</div>
            <div className="knowledge-base-directory-action">
              <div className="action-summary">
                <IconBulb />
                <span>AI Summary</span>
              </div>
              <div className="action-markdown-content active">
                <IconBook />
              </div>
              <div className="action-external-origin-website">
                <IconCompass />
              </div>
            </div>
            <div className="knowledge-base-directory-keyword-list">
              {item.keywords.map((keyword, index) => (
                <div
                  className="knowledge-base-directory-keyword-item"
                  key={index}>
                  <span>{keyword}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
