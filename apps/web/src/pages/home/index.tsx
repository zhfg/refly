import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import { WriteGuide } from "@refly-packages/ai-workspace-common/components/home-page/write-guide"
import { Button, Modal } from "@arco-design/web-react"
import { useTranslation } from "react-i18next"

import "./index.scss"
import Logo from "@/assets/logo.svg"

const Home = () => {
  const { t } = useTranslation()
  const userStore = useUserStoreShallow(state => ({
    userProfile: state.userProfile,
    setLoginModalVisible: state.setLoginModalVisible,
  }))

  if (!userStore.userProfile) {
    return (
      <Modal
        className="landing-modal"
        visible={true}
        footer={null}
        autoFocus={false}
        focusLock={true}
        closable={false}
        style={{ backgroundColor: "#FFFFFF" }}>
        <div className="h-full">
          <div className="landing-modal-login">
            <div className="logo">
              <img src={Logo} alt="Refly" />
              <span>Refly </span>
            </div>

            <Button
              className="login-btn"
              type="primary"
              onClick={() => userStore.setLoginModalVisible(true)}>
              {t("common.login")}
            </Button>
          </div>

          <div className="write-guide-container">
            <WriteGuide isLogin={false} />
          </div>
        </div>
      </Modal>
    )
  }

  return <WriteGuide isLogin={true} />
}

export default Home
