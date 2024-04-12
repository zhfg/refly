import { Message as message } from "@arco-design/web-react"

import { sendToBackground } from "@plasmohq/messaging"
import { useState } from "react"
import { useWebLinkIndexed } from "~hooks/use-weblink-indexed"
import { delay } from "~utils/delay"
// utils
import * as cheerio from "cheerio"

export const useStoreWeblink = () => {
  // 网页索引状态
  const { isWebLinkIndexed, setIsWebLinkIndexed } = useWebLinkIndexed()
  const [uploadingStatus, setUploadingStatus] = useState<
    "normal" | "loading" | "failed" | "success"
  >("normal")

  const handleUploadWebsite = async (url: string) => {
    // setIsUpdatingWebiste(true)
    setUploadingStatus("loading")

    const description = document.head.querySelector('meta[name="description"]')

    const $ = cheerio.load(document?.documentElement?.innerHTML)

    // remove all styles and scripts tag
    $("script, style, plasmo-csui, img, svg, meta, link").remove()
    // remove comments blocks
    $("body")
      .contents()
      .each((i, node) => {
        if (node.type === "comment") {
          $(node).remove()
        }
      })
    const pageContent = $.html()

    const res = await sendToBackground({
      name: "storeWeblink",
      body: {
        url,
        origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
        originPageTitle: document?.title || "",
        originPageUrl: location.href,
        originPageDescription: (description as any)?.content || "",
        pageContent: pageContent || "", // 上传 HTML String 用于后续的操作
      },
    })

    console.log("storeWeblink", res)
    await delay(2000)

    setTimeout(() => {
      setUploadingStatus("normal")
    }, 3000)

    return res
  }

  return {
    isWebLinkIndexed,
    uploadingStatus,
    handleUploadWebsite,
  }
}
