import { Link } from "react-router-dom"
import Logo from "@/assets/logo.svg"
import { useTranslation } from "react-i18next"
import "./footer.scss"
import { Button } from "antd"
import { IconDown, IconGithub, IconTwitter } from "@arco-design/web-react/icon"
import { UILocaleList } from "@refly-packages/ai-workspace-common/components/ui-locale-list"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"

function Footer() {
  const { t } = useTranslation()
  const { setLoginModalVisible } = useUserStoreShallow(state => ({
    setLoginModalVisible: state.setLoginModalVisible,
  }))

  // Add scroll to top function
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    const elem = document.querySelector(".scroll-tag")
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="px-6">
      <div className="py-12 md:py-16">
        <div className="mx-auto w-full md:w-[70%]">
          {/* CTA Block */}
          <div
            className="mb-[72px] flex h-[380px] w-full flex-col items-center justify-center rounded-[20px] border border-[#E3E3E3] p-12 text-center font-['Alibaba_PuHuiTi_Bold',system-ui,-apple-system,sans-serif]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #F8E2D3 0%, #FCFBFA 95%, #FCFAF9 100%, #FCFCFC 100%, #FFFFFF 100%)",
            }}>
            <h2 className="mb-6 font-['Alibaba_PuHuiTi_Bold',system-ui,-apple-system,sans-serif] text-3xl font-bold md:text-4xl">
              {t("landingPage.footer.cta.title")}
            </h2>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                type="primary"
                onClick={() => setLoginModalVisible(true)}
                size="large"
                className="cursor-pointer">
                {t("landingPage.footer.cta.getStarted")}
              </Button>
              <Button
                size="large"
                onClick={() => {
                  // Add your contact logic here
                  window.open(
                    "https://powerformer.feishu.cn/share/base/form/shrcnaVXPlMWxOC6cJDa7q3cPzd",
                    "_blank",
                  )
                }}
                className="cursor-pointer">
                {t("landingPage.footer.cta.contactUs")}
              </Button>
            </div>
          </div>

          {/* Main Footer Content */}
          <div
            className="w-full rounded-[20px] border border-[#E3E3E3] p-8 md:p-12"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #FAF8F4 0%, #FCFBFA 95%, #FCFAF9 100%, #FCFCFC 100%, #FFFFFF 100%)",
            }}>
            {/* Updated Footer Layout - Changed grid columns ratio */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[40%_1fr]">
              {/* Left Column - Logo, Description, Social */}
              <div className="w-full">
                <Link
                  to="/"
                  className="mb-4 inline-block no-underline"
                  aria-label="Refly">
                  <div className="flex items-center gap-2">
                    <img src={Logo} alt="" className="h-8 w-8" />
                    <span className="text-xl font-bold text-black">Refly</span>
                  </div>
                </Link>
                <p className="mb-6 max-w-[320px] text-base leading-relaxed text-gray-600">
                  {t("landingPage.anotherDescription")}
                </p>
                <div className="flex items-center justify-start gap-8">
                  {/* Social Media Links */}
                  <div className="flex items-center gap-4">
                    <Link
                      to="https://twitter.com/tuturetom"
                      target="_blank"
                      className="rounded-md bg-gray-100 px-4 py-1 text-gray-600 no-underline transition hover:bg-gray-200"
                      aria-label="Twitter">
                      <IconTwitter />
                    </Link>
                    <Link
                      to="https://github.com/pftom/refly"
                      target="_blank"
                      className="rounded-md bg-gray-100 px-4 py-1 text-gray-600 no-underline transition hover:bg-gray-200"
                      aria-label="GitHub">
                      <IconGithub />
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="h-4 w-[1px] bg-gray-200"></div>

                  {/* Language Selector */}
                  <div className="flex cursor-pointer items-center text-gray-600 hover:text-[#00968f]">
                    <UILocaleList>
                      {t("language")}{" "}
                      <IconDown className="ml-1 transition-transform duration-200 group-hover:rotate-180" />
                    </UILocaleList>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Powerformer, Inc.
                  </p>
                </div>
              </div>

              {/* Right Column - Navigation Links */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {/* First Column */}
                <div className="grid auto-rows-min content-start gap-8">
                  {/* Products Section */}
                  <div>
                    <h6 className="mb-1 text-[14px] font-medium">
                      {t("landingPage.footer.product.title")}
                    </h6>
                    <ul className="list-none text-sm">
                      {t("landingPage.footer.product.list", {
                        returnObjects: true,
                      })?.map((item: string, index: number) => (
                        <li key={index} className="mb-1">
                          <Link
                            to="#"
                            onClick={scrollToTop}
                            className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources Section */}
                  <div>
                    <h6 className="mb-1 text-[14px] font-medium">
                      {t("landingPage.footer.resource.title")}
                    </h6>
                    <ul className="list-none text-sm">
                      {t("landingPage.footer.resource.list", {
                        returnObjects: true,
                      })?.map((item: string, index: number) => (
                        <li key={index} className="mb-1">
                          <Link
                            to="https://twitter.com/tuturetom"
                            target="_blank"
                            className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Second Column */}
                <div className="grid auto-rows-min content-start gap-8">
                  {/* About Section */}
                  <div>
                    <h6 className="mb-1 text-[14px] font-medium">
                      {t("landingPage.footer.about.title")}
                    </h6>
                    <ul className="list-none text-sm">
                      {t("landingPage.footer.about.list", {
                        returnObjects: true,
                      })?.map((item: string, index: number) => (
                        <li key={index} className="mb-1">
                          <Link
                            to={index === 0 ? "/privacy" : "/terms"}
                            className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contact Us Section */}
                  <div>
                    <h6 className="mb-1 text-[14px] font-medium">
                      {t("landingPage.footer.contactUs.title")}
                    </h6>
                    <ul className="list-none text-sm">
                      {t("landingPage.footer.contactUs.list", {
                        returnObjects: true,
                      })?.map((item: string, index: number) => (
                        <li key={index} className="mb-1">
                          <Link
                            to={`mailto:${item}`}
                            className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
