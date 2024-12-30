import Logo from "@/assets/logo.svg"
import { Button } from "antd"
import { useTranslation } from "react-i18next"
import { useAuthStoreShallow } from "@refly-packages/ai-workspace-common/stores/auth"
import { UILocaleList } from "@refly-packages/ai-workspace-common/components/ui-locale-list"
import { IconDown } from "@refly-packages/ai-workspace-common/components/common/icon"
import { useState, useEffect } from "react"
import {
  useNavigate,
  useLocation,
} from "@refly-packages/ai-workspace-common/utils/router"
import "./header.scss"
function Header() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const location = useLocation()
  const { setLoginModalOpen } = useAuthStoreShallow(state => ({
    setLoginModalOpen: state.setLoginModalOpen,
  }))

  const [value, setValue] = useState("product")
  const tabOptions = [
    {
      label: t("landingPage.tab.product"),
      value: "product",
    },
    {
      label: t("landingPage.tab.price"),
      value: "pricing",
    },
    {
      label: t("landingPage.tab.docs"),
      value: "docs",
    },
    {
      label: t("landingPage.tab.discord"),
      value: "discord",
    },
  ]

  useEffect(() => {
    setValue(location.pathname.split("/")[1] || "product")
  }, [location.pathname])

  return (
    <div className="fixed top-0 z-20 flex w-full !justify-center px-6 backdrop-blur-lg sm:px-6 md:px-6 lg:px-0">
      <div className="relative flex w-full items-center justify-between py-4 md:w-[65%]">
        <div
          className="mr-4 flex shrink-0 flex-row items-center"
          style={{ height: 45 }}>
          <div className="flex h-full flex-row items-center">
            <img src={Logo} className="w-[35px]" alt="Refly Logo" />
            <span className="ml-2 text-base font-bold">Refly</span>
          </div>
          <div className="ml-4 flex flex-row items-center">
            {tabOptions.map(item => (
              <Button
                type="text"
                key={item.value}
                className={`${value === item.value ? "font-bold text-[#00968f]" : ""}`}
                onClick={() => {
                  setValue(item.value)
                  switch (item.value) {
                    case "product":
                      navigate("/")
                      break
                    case "pricing":
                      navigate("/pricing")
                      break
                  }
                }}>
                {item.label}
              </Button>
            ))}
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
