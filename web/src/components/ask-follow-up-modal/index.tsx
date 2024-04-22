import { Message as message, Modal } from "@arco-design/web-react"
import { useState } from "react"
// components
// styles
import "./index.scss"
// request
import createNewConversation from "@/requests/createNewConversation"
import { Digest, Feed, Thread } from "@/types"
import { useChatStore } from "@/stores/chat"
import { useConversationStore } from "@/stores/conversation"
import { useResetState } from "@/hooks/use-reset-state"
import { useNavigate } from "react-router-dom"
import { delay } from "@/utils/delay"
import { useTranslation } from "react-i18next"

interface SummaryModalProps {
  aigcContent: Digest | Feed
  visible: boolean
  setVisible: (visible: boolean) => void
}

/**
 *
 * 用于为 Feed & Digest 的 Source 提供弹框总结能力
 */
export const AskFollowUpModal = (props: SummaryModalProps) => {
  const { aigcContent } = props
  const [isFetching, setIsFetching] = useState(false)
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const navigate = useNavigate()

  const { t } = useTranslation()
  const { resetState } = useResetState()

  const handleDigestAskFollow = async () => {
    try {
      setIsFetching(true)
      const { newQAText } = useChatStore.getState()
      console.log("newQAText", newQAText)
      const question = newQAText

      // TODO: origin/originPageUrl 需要确定
      const newConversationPayload = {
        origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
        originPageTitle: aigcContent?.title || "",
        title: aigcContent?.title || "",
        originPageUrl: location.href,
      }

      // 创建新会话
      const res = await createNewConversation({
        body: {
          ...newConversationPayload,
          contentId: aigcContent?.id,
        },
      })

      console.log("createNewConversation", res)
      conversationStore.setCurrentConversation(res?.data as Thread)

      resetState()

      // 更新新的 newQAText，for 新会话跳转使用
      chatStore.setNewQAText(question)
      chatStore.setIsAskFollowUpNewConversation(true)

      message.success({
        content: t("contentDetail.item.askFollow.successNotify"),
        duration: 2000,
      })
      await delay(2000)
      navigate(`/thread/${res?.data?.id}`)
    } catch (err) {
      message.error(t("contentDetail.item.askFollow.errorNotify"))
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <Modal
      visible={props.visible}
      title={t("contentDetail.item.askFollow.modal.title")}
      okText={t("contentDetail.item.askFollow.modal.okText")}
      cancelText={t("contentDetail.item.askFollow.modal.cancelText")}
      okButtonProps={{ loading: isFetching }}
      onOk={() => handleDigestAskFollow()}
      onCancel={() => props.setVisible(false)}>
      <div className="ask-follow-up-content">
        {t("contentDetail.item.askFollow.modal.content", {
          question: chatStore.newQAText,
        })}
      </div>
    </Modal>
  )
}
