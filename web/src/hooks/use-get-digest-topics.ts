import { useDigestTopicStore } from "@/stores/digest-topics"
// requests
import getDigestTopicList from "@/requests/getTopicList"
import { useState } from "react"

export const useGetDigestTopics = () => {
  const digestTopicStore = useDigestTopicStore()
  const [isFetching, setIsFetching] = useState(false)

  const fetchDigestTopicData = async (currentPage = 1) => {
    setIsFetching(true)

    const { topicList = [], pageSize } = useDigestTopicStore.getState()
    if (topicList.length > 0 && topicList?.length < pageSize) {
      return
    }

    const newRes = await getDigestTopicList({
      body: {
        page: currentPage,
        pageSize: 10,
      },
    })

    digestTopicStore.updateCurrentPage(currentPage)

    if (!newRes?.success) {
      setIsFetching(false)
      throw new Error(newRes?.errMsg)
    }
    if (
      newRes?.data &&
      newRes?.data?.list?.length < digestTopicStore?.pageSize
    ) {
      digestTopicStore.updateHasMore(false)
    }

    console.log("newRes", newRes)
    digestTopicStore.updateTopicList(newRes?.data?.list || [])
    digestTopicStore.updateTopicTotalCnt(
      newRes?.data?.total || newRes?.data?.list?.length || 0,
    )
    setIsFetching(false)
  }

  return { fetchDigestTopicData, isFetching }
}
