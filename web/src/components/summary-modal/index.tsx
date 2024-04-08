import { Message as message, Modal, Skeleton } from "@arco-design/web-react"
import { useEffect, useState } from "react"
// components
import { Markdown } from "../markdown"
// styles
import "./index.scss"

interface SummaryModalProps {
  id: string
  getDetail: (id: string) => Promise<string | undefined>
  visible: boolean
  setVisible: (visible: boolean) => void
}

/**
 *
 * 用于为 Feed & Digest 的 Source 提供弹框总结能力
 */
export const SummaryModal = (props: SummaryModalProps) => {
  const [isFetching, setIsFetching] = useState(false)
  const [summaryContent, setSummaryContent] = useState("")

  const getDetail = async () => {
    try {
      setIsFetching(true)
      const res = await props.getDetail(props.id)
      setSummaryContent(res as string)

      message.success("获取总结详情成功！")
    } catch (err) {
      message.error("获取总结详情失败，请重试！")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    getDetail()
  }, [])

  return (
    <Modal
      style={{ width: 800, paddingTop: 24 }}
      visible={props.visible}
      onCancel={() => props.setVisible(false)}
      footer={null}>
      {isFetching ? (
        <>
          <Skeleton animation text={{ rows: 16 }}></Skeleton>
        </>
      ) : (
        <div className="summary-modal-content">
          <Markdown content={summaryContent} />
        </div>
      )}
    </Modal>
  )
}
