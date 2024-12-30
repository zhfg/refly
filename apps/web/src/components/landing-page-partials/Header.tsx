import Logo from "@/assets/logo.svg"
import { Button } from "antd"
import { useTranslation } from "react-i18next"
import { useAuthStoreShallow } from "@refly-packages/ai-workspace-common/stores/auth"
import { UILocaleList } from "@refly-packages/ai-workspace-common/components/ui-locale-list"
import { IconDown } from "@refly-packages/ai-workspace-common/components/common/icon"

function Header() {
  const { t } = useTranslation()
  const { setLoginModalOpen } = useAuthStoreShallow(state => ({
    setLoginModalOpen: state.setLoginModalOpen,
  }))

  return (
    <div className="fixed top-0 z-20 flex w-full !justify-center px-6 backdrop-blur-lg sm:px-6 md:px-6 lg:px-0">
      <div className="relative flex w-full items-center justify-between py-4 md:w-[65%]">
        <div className="mr-4 shrink-0" style={{ height: 45 }}>
          <div className="flex flex-row items-center">
            <img src={Logo} className="w-[35px]" alt="Refly Logo" />
            <span className="ml-2 text-base font-bold">Refly</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UILocaleList>
            <Button type="text" size="small">
              {t("language")}{" "}
              <IconDown className="ml-1 transition-transform duration-200 group-hover:rotate-180" />
            </Button>
          </UILocaleList>
          <Button type="primary" onClick={() => setLoginModalOpen(true)}>
            {t("landingPage.tryForFree")}
          </Button>
          <Button
            onClick={() => {
              window.open(
                "https://powerformer.feishu.cn/wiki/Syrsw7DJxiaExSkoSiXcTF1inBg?from=landingPage",
                "_blank",
              )
            }}>
            {t("landingPage.contactUs")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Header
