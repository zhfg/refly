import { Message as message } from "@arco-design/web-react"

import { sendToBackground } from "@plasmohq/messaging"
import { useState } from "react"
import { useWebLinkIndexed } from "~hooks/use-weblink-indexed"

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

    const res = await sendToBackground({
      name: "storeWeblink",
      body: {
        url,
        origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
        originPageTitle: document?.title || "",
        originPageUrl: location.href,
        originPageDescription: (description as any)?.content || "",
      },
    })

    if (res.success) {
      message.success("阅读成功！")
      setIsWebLinkIndexed(true)
    } else {
      message.error("阅读失败！")
    }

    setTimeout(() => {
      setUploadingStatus("normal")
    }, 3000)
  }

  return {
    isWebLinkIndexed,
    uploadingStatus,
    handleUploadWebsite,
  }
}
