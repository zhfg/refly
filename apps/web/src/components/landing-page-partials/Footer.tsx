import { Link } from "react-router-dom"
import Logo from "@/assets/logo.svg"
import { useTranslation } from "react-i18next"
import "./footer.scss"

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="px-6 sm:px-6 md:px-6 lg:px-0">
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Top area: Blocks */}
          <div className="mb-8 grid gap-8 md:mb-12 md:grid-cols-12 lg:gap-20">
            {/* 1st block */}
            <div className="md:col-span-4 lg:col-span-5">
              <div className="mb-2">
                {/* Logo */}
                <Link to="/" className="inline-block" aria-label="Cruip">
                  <div className="logo">
                    <img
                      className="logo-img"
                      src={Logo}
                      alt=""
                      style={{ width: 34, height: 34 }}
                    />
                    <span className="title">Refly</span>
                  </div>
                </Link>
              </div>
              <div className="text-gray-400">
                {t("landingPage.footer.description")}
              </div>
            </div>

            {/* 2nd, 3rd and 4th blocks */}
            <div className="grid gap-8 sm:grid-cols-3 md:col-span-8 lg:col-span-7">
              {/* 2nd block */}
              <div className="text-sm">
                <h6 className="mb-1 font-medium">
                  {t("landingPage.footer.product.title")}
                </h6>
                <ul>
                  <li className="mb-1">
                    <Link
                      target="_blank"
                      to="https://chromewebstore.google.com/detail/lecbjbapfkinmikhadakbclblnemmjpd"
                      className="text-gray-400 transition duration-150 ease-in-out hover:text-gray-100">
                      {t("landingPage.footer.product.one")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 3rd block */}
              <div className="text-sm">
                <h6 className="mb-1 font-medium">
                  {t("landingPage.footer.resource.title")}
                </h6>
                <ul>
                  <li className="mb-1">
                    <Link
                      to="https://twitter.com/tuturetom"
                      target="_blank"
                      className="text-gray-400 transition duration-150 ease-in-out hover:text-gray-100">
                      {t("landingPage.footer.resource.one")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 5th block */}
              <div className="text-sm">
                <h6 className="mb-1 font-medium">
                  {t("landingPage.footer.about.title")}
                </h6>
                <ul>
                  <li className="mb-1">
                    <Link
                      to="/privacy"
                      className="text-gray-400 transition duration-150 ease-in-out hover:text-gray-100">
                      {t("landingPage.footer.about.one")}
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      to="/terms"
                      className="text-gray-400 transition duration-150 ease-in-out hover:text-gray-100">
                      {t("landingPage.footer.about.two")}
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="text-sm">
                <h6 className="mb-1 font-medium">
                  {t("landingPage.footer.contactUs.title")}
                </h6>
                <ul>
                  <li className="mb-1">
                    <Link
                      to="mailto:pftom@qq.com"
                      className="text-gray-400 transition duration-150 ease-in-out hover:text-gray-100">
                      {t("landingPage.footer.contactUs.one")}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom area */}
          <div className="md:flex md:items-center md:justify-between">
            {/* Social links */}
            <ul className="mb-4 flex md:order-1 md:mb-0 md:ml-4">
              <li>
                <Link
                  target="_blank"
                  to="https://twitter.com/tuturetom"
                  className="flex items-center justify-center rounded-full bg-gray-800 text-green-600 transition duration-150 ease-in-out hover:bg-green-600 hover:text-gray-100"
                  aria-label="Twitter">
                  <svg
                    color="#fff"
                    fill="#00968F"
                    className="h-8 w-8 fill-current"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 11.5c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.4-1.8-.6.4-1.3.6-2.1.8-.6-.6-1.5-1-2.4-1-1.7 0-3.2 1.5-3.2 3.3 0 .3 0 .5.1.7-2.7-.1-5.2-1.4-6.8-3.4-.3.5-.4 1-.4 1.7 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.5 1.4-4.1 1.4H8c1.5.9 3.2 1.5 5 1.5 6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.3-1.1 1.7-1.8z" />
                  </svg>
                </Link>
              </li>
            </ul>

            {/* Copyrights note */}
            <div className="mr-4 text-sm text-gray-400">
              &copy; {t("landingPage.footer.right")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
