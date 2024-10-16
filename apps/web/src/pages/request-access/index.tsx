import { Result, Button, Modal, Typography } from "@arco-design/web-react"
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
          title={
            <div>
              <div className="mb-2" style={{ fontSize: "18px" }}>
                {t("requestAccess.description")}
              </div>
              <div style={{ color: "rgba(0, 0, 0, 0.5)" }}>
                {t("requestAccess.copyEmail")}
                <Typography.Text copyable>
                  {userStore?.userProfile?.email}
                </Typography.Text>
              </div>
            </div>
          }
          extra={
            <Button
              type="primary"
              onClick={() => {
                window.open(
                  "https://powerformer.feishu.cn/share/base/form/shrcnoAvzorf8Xmds4ROVhmQEyg",
                  "_blank",
                )
              }}>
              {t("requestAccess.apply")}
            </Button>
          }></Result>
      </div>
    </Modal>
  )
}

export default RequestAccess
