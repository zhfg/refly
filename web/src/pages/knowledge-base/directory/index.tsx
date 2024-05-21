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
import {
  Divider,
  Input,
  Skeleton,
  Message as message,
} from "@arco-design/web-react"
import { useSearchableList } from "@/components/use-searchable-list"
import { useEffect, useState } from "react"
import type { ResourceDetail } from "@/types/knowledge-base"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useKnowledgeBaseStore } from "@/stores/knowledge-base"
// 类型
import { CollectionDetail } from "@/types/knowledge-base"
// 请求
import getKnowledgeBaseDetail from "@/requests/getKnowledgeBaseDetail"
import { safeParseURL } from "@/utils/url"

export const KnowledgeBaseDirectory = () => {
  const [searchVal, setSearchVal] = useState("")
  const [directoryList, setDirectoryList, filter] =
    useSearchableList<ResourceDetail>("title", {
      debounce: true,
      delay: 300,
    })
  const [isFetching, setIsFetching] = useState(false)
  const knowledgeBaseStore = useKnowledgeBaseStore()
  const navigate = useNavigate()

  const [queryParams] = useSearchParams()
  const kbId = queryParams.get("kbId")
  const resId = queryParams.get("resId")

  const handleGetDetail = async (collectionId: string, resourceId: string) => {
    setIsFetching(true)
    try {
      const newRes = await getKnowledgeBaseDetail({
        body: {
          collectionId,
        },
      })

      if (!newRes?.success) {
        throw new Error(newRes?.errMsg)
      }

      console.log("newRes", newRes)
      knowledgeBaseStore.updateCurrentKnowledgeBase(
        newRes?.data as CollectionDetail,
      )

      // 如果没有资源，则跳转到第一个资源
      if (!resourceId) {
        const firstResourceId = newRes?.data?.resources?.[0]?.resourceId
        if (firstResourceId) {
          navigate(
            `/knowledge-base?kbId=${collectionId}&resId=${firstResourceId}`,
          )
        }
      }
    } catch (err) {
      message.error("获取内容详情失败，请重新刷新试试")
    }
    setIsFetching(false)
  }

  useEffect(() => {
    if (kbId) {
      console.log("params kbId", kbId)
      handleGetDetail(kbId as string, resId as string)
    }
  }, [kbId, resId])

  const handleChange = (val: string) => {
    filter(val)
    setSearchVal(val)
  }

  useEffect(() => {
    const mappedDirectoryList = (
      knowledgeBaseStore?.currentKnowledgeBase?.resources || []
    ).map(item => ({ ...item, title: item?.data?.title || "" }))
    setDirectoryList(mappedDirectoryList)
  }, [knowledgeBaseStore?.currentKnowledgeBase?.resources])

  return (
    <div className="knowledge-base-directory-container">
      <div className="knowledge-base-directory-intro">
        <div className="intro-body">
          <div className="intro-icon">
            <IconFile style={{ fontSize: 28, color: "rgba(0, 0, 0, .5)" }} />
          </div>
          <div className="intro-content">
            <div className="intro-title">
              {knowledgeBaseStore?.currentKnowledgeBase?.title}
            </div>
            <div className="intro-meta">
              <span>
                {time(
                  knowledgeBaseStore?.currentKnowledgeBase?.updatedAt as string,
                  LOCALE.EN,
                )
                  .utc()
                  .fromNow()}
              </span>
              {" · "}
              <span>
                {knowledgeBaseStore?.currentKnowledgeBase?.resources?.length ||
                  0}{" "}
                个内容
              </span>
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
        {isFetching ? (
          <div style={{ margin: "20px auto" }}>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          </div>
        ) : (
          (directoryList || []).map((item, index) => (
            <div
              className="knowledge-base-directory-item"
              key={index}
              onClick={() => {
                navigate(
                  `/knowledge-base?kbId=${kbId}&resId=${item?.resourceId}`,
                )
              }}>
              <div className="knowledge-base-directory-site-intro">
                <div className="site-intro-icon">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${safeParseURL(item?.data?.url as string)}&sz=${32}`}
                    alt={item?.data?.url}
                  />
                </div>
                <div className="site-intro-content">
                  <p className="site-intro-site-name">{item.data?.title}</p>
                  <a
                    className="site-intro-site-url"
                    href={item.data?.url}
                    target="_blank">
                    {item.data?.url}
                  </a>
                </div>
              </div>
              <div className="knowledge-base-directory-title">
                {item.data?.title}
              </div>
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
                {(item?.data?.keywords || [])?.map((keyword, index) => (
                  <div
                    className="knowledge-base-directory-keyword-item"
                    key={index}>
                    <span>{keyword}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
