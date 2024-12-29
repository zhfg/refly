import { Button, Modal, Divider, Input, Form } from "antd"
import { Link } from "@refly-packages/ai-workspace-common/utils/router"
import { useState } from "react"

import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"

import Logo from "@/assets/logo.svg"
import Google from "@/assets/google.svg"
import GitHub from "@/assets/github-mark.svg"

import { getServerOrigin } from "@refly/utils/url"
import { useTranslation } from "react-i18next"
import getClient from "@refly-packages/ai-workspace-common/requests/proxiedRequest"
import { useVerificationStoreShallow } from "@refly-packages/ai-workspace-common/stores/verification"

interface FormValues {
  email: string
  password: string
}

export const LoginModal = (props: { visible?: boolean; from?: string }) => {
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const userStore = useUserStoreShallow(state => ({
    setIsLogin: state.setIsLogin,
    setLoginProvider: state.setLoginProvider,
    isLogin: state.isLogin,
    loginProvider: state.loginProvider,
    loginModalVisible: state.loginModalVisible,
    setLoginModalVisible: state.setLoginModalVisible,
  }))
  const verificationStore = useVerificationStoreShallow(state => ({
    setModalOpen: state.setModalOpen,
    setSessionId: state.setSessionId,
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

  const handleEmailAuth = async () => {
    const values = await form.validateFields()

    userStore.setIsLogin(true)
    userStore.setLoginProvider("email")

    if (isSignUpMode) {
      const { data } = await getClient().emailSignup({
        body: {
          email: values.email,
          password: values.password,
        },
      })
      userStore.setIsLogin(false)

      if (data?.success) {
        userStore.setLoginModalVisible(false)
        verificationStore.setModalOpen(true)
        verificationStore.setSessionId(data.data?.sessionId ?? null)
      }
    } else {
      const { data } = await getClient().emailLogin({
        body: {
          email: values.email,
          password: values.password,
        },
      })
      userStore.setIsLogin(false)

      if (data?.success) {
        userStore.setLoginModalVisible(false)
        document.cookie = `_refly_ai_sid=${data.data?.accessToken ?? ""}; path=/`
        window.location.reload()
      }
    }
  }

  const handleModeSwitch = (signUp: boolean) => {
    setIsSignUpMode(signUp)
    form.resetFields()
  }

  return (
    <Modal
      open={props.visible || userStore.loginModalVisible}
      centered
      footer={null}
      width={410}
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
            {isSignUpMode
              ? t("landingPage.loginModal.signupTitle")
              : t("landingPage.loginModal.signinTitle")}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {isSignUpMode
            ? t("landingPage.loginModal.signupSubtitle")
            : t("landingPage.loginModal.signinSubtitle")}
        </div>
        <div className="mt-4 flex flex-row items-center justify-center gap-2">
          <Button
            onClick={() => handleLogin("github")}
            className="mt-2 h-8 w-40"
            loading={userStore.isLogin && userStore.loginProvider === "github"}
            disabled={
              userStore.isLogin && userStore.loginProvider !== "github"
            }>
            <img src={GitHub} alt="github" className="mr-1 h-4 w-4" />
            {userStore.isLogin && userStore.loginProvider === "github"
              ? t("landingPage.loginModal.loggingStatus")
              : t("landingPage.loginModal.oauthBtn.github")}
          </Button>
          <Button
            onClick={() => handleLogin("google")}
            className="mt-2 h-8 w-40"
            loading={userStore.isLogin && userStore.loginProvider === "google"}
            disabled={
              userStore.isLogin && userStore.loginProvider !== "google"
            }>
            <img src={Google} alt="google" className="mr-1 h-4 w-4" />
            {userStore.isLogin && userStore.loginProvider === "google"
              ? t("landingPage.loginModal.loggingStatus")
              : t("landingPage.loginModal.oauthBtn.google")}
          </Button>
        </div>

        <Divider className="flex-1">or</Divider>

        <Form
          form={form}
          layout="vertical"
          className="w-full max-w-sm px-4"
          requiredMark={false}>
          <Form.Item
            name="email"
            label={
              <span className="font-medium">
                {t("landingPage.loginModal.emailLabel")}
              </span>
            }
            validateTrigger={["onBlur"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: (
                  <span className="text-xs text-red-500">
                    {t("landingPage.loginModal.verifyRules.emailRequired")}
                  </span>
                ),
              },
              {
                type: "email",
                message: (
                  <span className="text-xs text-red-500">
                    {t("landingPage.loginModal.verifyRules.emailInvalid")}
                  </span>
                ),
              },
            ]}>
            <Input
              type="email"
              placeholder={t("landingPage.loginModal.emailPlaceholder")}
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span className="font-medium">
                {t("landingPage.loginModal.passwordLabel")}
              </span>
            }
            validateTrigger={["onBlur"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: (
                  <span className="text-xs text-red-500">
                    {t("landingPage.loginModal.verifyRules.passwordRequired")}
                  </span>
                ),
              },
              ...(isSignUpMode
                ? [
                    {
                      min: 8,
                      message: (
                        <span className="text-xs text-red-500">
                          {t("landingPage.loginModal.verifyRules.passwordMin")}
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}>
            <Input.Password
              placeholder={t("landingPage.loginModal.passwordPlaceholder")}
              className="h-8"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              onClick={handleEmailAuth}
              loading={userStore.isLogin && userStore.loginProvider === "email"}
              className="h-10 w-full text-base">
              {t("landingPage.loginModal.continue")}
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 text-sm">
          {isSignUpMode ? (
            <span>
              {t("landingPage.loginModal.signinHint") + " "}
              <Button
                type="link"
                className="p-0 text-green-600"
                onClick={() => handleModeSwitch(false)}>
                {t("landingPage.loginModal.signin")}
              </Button>
            </span>
          ) : (
            <span>
              {t("landingPage.loginModal.signupHint") + " "}
              <Button
                type="link"
                className="p-0 text-green-600"
                onClick={() => handleModeSwitch(true)}>
                {t("landingPage.loginModal.signup")}
              </Button>
            </span>
          )}
        </div>

        <div className="mt-2 text-center text-xs text-gray-500">
          {t("landingPage.loginModal.utilText")}
          <Link
            to={`/terms`}
            className="mx-1 text-xs text-green-600 underline"
            onClick={() => {
              userStore.setLoginModalVisible(false)
            }}>
            {t("landingPage.loginModal.terms")}
          </Link>
          {t("landingPage.loginModal.and")}
          <Link
            to={`/privacy`}
            className="mx-1 text-xs text-green-600 underline"
            onClick={() => {
              userStore.setLoginModalVisible(false)
            }}>
            {t("landingPage.loginModal.privacyPolicy")}
          </Link>
        </div>
      </div>
    </Modal>
  )
}
