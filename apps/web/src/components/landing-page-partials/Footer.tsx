import { Link } from "react-router-dom"
import Logo from "@/assets/logo.svg"
import { useTranslation } from "react-i18next"
import "./footer.scss"
import { Button } from "antd"

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="px-6">
      <div className="py-12 md:py-16">
        <div className="mx-auto w-full md:w-[70%]">
          {/* CTA Block */}
          <div
            className="mb-[72px] flex h-[380px] w-full flex-col items-center justify-center rounded-[20px] border border-[#E3E3E3] p-12 text-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #F8E2D3 0%, #FCFBFA 95%, #FCFAF9 100%, #FCFCFC 100%, #FFFFFF 100%)",
            }}>
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              {t("landingPage.footer.cta.title")}
            </h2>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="large"
                className="rounded-md bg-[#00968F] px-8 py-3 text-white transition hover:bg-[#007A74]"
                target="_blank">
                {t("landingPage.footer.cta.getStarted")}
              </Button>
              <Button
                size="large"
                className="rounded-md bg-white px-8 py-3 text-[#00968F] shadow-sm transition hover:bg-gray-50"
                target="_blank">
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
            {/* Updated Footer Layout */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
              {/* Left Column - Logo, Description, Social */}
              <div className="max-w-[360px]">
                <Link to="/" className="mb-4 inline-block" aria-label="Refly">
                  <div className="flex items-center gap-2">
                    <img src={Logo} alt="" className="h-8 w-8" />
                    <span className="text-xl font-bold">Refly</span>
                  </div>
                </Link>
                <p className="mb-6 max-w-[320px] text-base leading-relaxed text-gray-600">
                  {t("landingPage.description")}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    to="https://twitter.com/tuturetom"
                    target="_blank"
                    className="rounded-full bg-gray-100 p-2 transition hover:bg-gray-200"
                    aria-label="Twitter">
                    <svg
                      className="h-5 w-5 fill-current text-gray-600"
                      viewBox="0 0 32 32">
                      <path d="M24 11.5c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.4-1.8-.6.4-1.3.6-2.1.8-.6-.6-1.5-1-2.4-1-1.7 0-3.2 1.5-3.2 3.3 0 .3 0 .5.1.7-2.7-.1-5.2-1.4-6.8-3.4-.3.5-.4 1-.4 1.7 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.5 1.4-4.1 1.4H8c1.5.9 3.2 1.5 5 1.5 6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.3-1.1 1.7-1.8z" />
                    </svg>
                  </Link>
                  <Link
                    to="https://github.com/pftom/refly"
                    target="_blank"
                    className="rounded-full bg-gray-100 p-2 transition hover:bg-gray-200"
                    aria-label="GitHub">
                    <svg
                      className="h-5 w-5 fill-current text-gray-600"
                      viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </Link>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Powerformer, Inc.
                  </p>
                </div>
              </div>

              {/* Right Column - Navigation Links */}
              <div className="grid gap-8 sm:grid-cols-2">
                {/* First Row */}
                <div className="grid gap-8">
                  {/* Products */}
                  <div className="text-sm">
                    <h6 className="mb-1 font-medium">
                      {t("landingPage.footer.product.title")}
                    </h6>
                    <ul className="list-none">
                      <li className="mb-1">
                        <Link
                          target="_blank"
                          to="https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd"
                          className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                          {t("landingPage.footer.product.one")}
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Resources */}
                  <div className="text-sm">
                    <h6 className="mb-1 font-medium">
                      {t("landingPage.footer.resource.title")}
                    </h6>
                    <ul className="list-none">
                      <li className="mb-1">
                        <Link
                          to="https://twitter.com/tuturetom"
                          target="_blank"
                          className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                          {t("landingPage.footer.resource.one")}
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid gap-8">
                  {/* About */}
                  <div className="text-sm">
                    <h6 className="mb-1 font-medium">
                      {t("landingPage.footer.about.title")}
                    </h6>
                    <ul className="list-none">
                      <li className="mb-1">
                        <Link
                          to="/privacy"
                          className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                          {t("landingPage.footer.about.one")}
                        </Link>
                      </li>
                      <li className="mb-1">
                        <Link
                          to="/terms"
                          className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                          {t("landingPage.footer.about.two")}
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Contact Us */}
                  <div className="text-sm">
                    <h6 className="mb-1 font-medium">
                      {t("landingPage.footer.contactUs.title")}
                    </h6>
                    <ul className="list-none">
                      <li className="mb-1">
                        <Link
                          to="mailto:pftom@qq.com"
                          className="text-gray-500 no-underline transition duration-150 ease-in-out hover:text-gray-700">
                          {t("landingPage.footer.contactUs.one")}
                        </Link>
                      </li>
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
