import { Result, Button, Modal } from "@arco-design/web-react"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import { useTranslation } from "react-i18next"

const RequestAccess = () => {
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
  }))
  const { t } = useTranslation()

  const visible = true

  return (
    <Modal
      visible={visible}
      closable={false}
      footer={null}
      autoFocus={false}
      maskStyle={{ background: "#FFFFFF" }}>
      <div className="request-access flex h-full items-center justify-center">
        <Result
          status="403"
          title={t("requestAccess.description", {
            email: userStore?.userProfile?.email,
          })}
          extra={
            <Button
              type="primary"
              onClick={() => {
                window.open("https://arco.design", "_blank")
              }}>
              {t("requestAccess.apply")}
            </Button>
          }></Result>
      </div>
    </Modal>
  )
}

export default RequestAccess
