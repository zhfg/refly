import { Modal, Input, Button, message } from "antd"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import {
  useVerificationStore,
  useVerificationStoreShallow,
} from "@refly-packages/ai-workspace-common/stores/verification"
import getClient from "@refly-packages/ai-workspace-common/requests/proxiedRequest"

export const VerificationModal = () => {
  const { t } = useTranslation()
  const { sessionId, modalOpen, setModalOpen, setSessionId } =
    useVerificationStoreShallow(state => ({
      sessionId: state.sessionId,
      modalOpen: state.modalOpen,
      setModalOpen: state.setModalOpen,
      setSessionId: state.setSessionId,
    }))
  console.log("sessionId", sessionId)
  const [isLoading, setIsLoading] = useState(false)
  const [otp, setOtp] = useState("")

  const handleSubmit = async () => {
    if (!otp) return

    const { sessionId } = useVerificationStore.getState()
    if (!sessionId) {
      message.error(t("emailVerification.sessionNotFound"))
      return
    }

    setIsLoading(true)
    const { data } = await getClient().checkVerification({
      body: {
        code: otp,
        sessionId: sessionId,
      },
    })
    setIsLoading(false)

    if (data?.success) {
      document.cookie = `_refly_ai_sid=${data?.data?.accessToken ?? ""}; path=/`
      setSessionId(null)
      setModalOpen(false)
      message.success(t("emailVerification.success"))
      window.location.reload()
    } else {
      message.error(t("emailVerification.error"))
    }
  }

  return (
    <Modal
      centered
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      footer={null}
      destroyOnClose
      title={t("emailVerification.title")}>
      <div className="flex flex-col gap-4 py-1">
        <p className="text-sm text-gray-700">
          {t("emailVerification.description")}
        </p>
        <div className="flex items-center justify-center">
          <Input.OTP size="large" value={otp} onChange={code => setOtp(code)} />
        </div>
        <div className="flex items-center text-sm">
          <div className="text-gray-500">
            {t("emailVerification.resendHint")}{" "}
          </div>

          <Button type="link" size="small" className="text-sm">
            {t("emailVerification.resend")}
          </Button>
        </div>

        <Button
          type="primary"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={otp?.length !== 6}
          className="w-full">
          {t("emailVerification.submit")}
        </Button>
      </div>
    </Modal>
  )
}
