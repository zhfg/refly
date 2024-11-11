import { Button, Modal, Divider, Typography } from "antd"
import { Link } from "@refly-packages/ai-workspace-common/utils/router"

// stores
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"

// assets
import Logo from "@/assets/logo.svg"
import Google from "@/assets/google.svg"
import GitHub from "@/assets/github-mark.svg"

// styles
import { getServerOrigin, getClientOrigin } from "@refly/utils/url"
import { useTranslation } from "react-i18next"

export const LoginModal = (props: { visible?: boolean; from?: string }) => {
  const userStore = useUserStoreShallow(state => ({
    setIsLogin: state.setIsLogin,
    setLoginProvider: state.setLoginProvider,
    isLogin: state.isLogin,
    loginProvider: state.loginProvider,
    loginModalVisible: state.loginModalVisible,
    setLoginModalVisible: state.setLoginModalVisible,
  }))

  const { t } = useTranslation()

  /**
   * 0. Get the login status from the main site. If not logged in, visit the Login page; after logging in, display the home page
   * 1. Open a modal to access the Refly main site for login
   * 2. After logging in, use Chrome's API to send a message to the extension. Upon receiving the message, reload the page to get the login status, then persist it
   * 3. Subsequently, make requests with the cookie or login status
   */
  const handleLogin = (provider: "github" | "google") => {
    userStore.setIsLogin(true)
    userStore.setLoginProvider(provider)
    location.href = `${getServerOrigin()}/v1/auth/${provider}`
  }

  return (
    <Modal
      open={props.visible || userStore.loginModalVisible}
      centered
      footer={null}
      onCancel={() => userStore.setLoginModalVisible(false)}>
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        <div className="flex flex-row items-center">
          <img src={Logo} alt="Refly" style={{ width: 24, height: 24 }} />
          <span
            style={{
              fontSize: 20,
              fontWeight: "bold",
              display: "inline-block",
              marginLeft: 8,
            }}>
            Refly
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {t("landingPage.loginModal.title")}
        </div>
        <div className="mt-4 flex flex-col items-center justify-center">
          <Button
            onClick={() => handleLogin("github")}
            className="mt-2 h-8 w-72"
            loading={userStore.isLogin && userStore.loginProvider === "github"}
            disabled={
              userStore.isLogin && userStore.loginProvider !== "github"
            }>
            <img src={GitHub} alt="github" className="mr-1 h-4 w-4" />
            {userStore.isLogin && userStore.loginProvider === "github"
              ? t("landingPage.loginModal.loggingStatus")
              : t("landingPage.loginModal.loginBtn.github")}
          </Button>
          <Button
            onClick={() => handleLogin("google")}
            className="mt-2 h-8 w-72"
            loading={userStore.isLogin && userStore.loginProvider === "google"}
            disabled={
              userStore.isLogin && userStore.loginProvider !== "google"
            }>
            <img src={Google} alt="google" className="mr-1 h-4 w-4" />
            {userStore.isLogin && userStore.loginProvider === "google"
              ? t("landingPage.loginModal.loggingStatus")
              : t("landingPage.loginModal.loginBtn.google")}
          </Button>
        </div>
        <Divider></Divider>
        <Typography.Paragraph className="text-xs font-bold text-gray-400">
          {t("landingPage.loginModal.utilText")}
          <Link
            to={`${getClientOrigin(true)}/terms`}
            className="mx-1"
            onClick={() => {
              userStore.setLoginModalVisible(false)
            }}>
            <Typography.Text underline>
              {t("landingPage.loginModal.terms")}
            </Typography.Text>
          </Link>
          {t("landingPage.loginModal.and")}
          <Link
            to={`${getClientOrigin(true)}/privacy`}
            className="mx-1"
            onClick={() => {
              userStore.setLoginModalVisible(false)
            }}>
            <Typography.Text underline>
              {t("landingPage.loginModal.privacyPolicy")}
            </Typography.Text>
          </Link>
        </Typography.Paragraph>
      </div>
    </Modal>
  )
}
