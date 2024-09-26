import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { useState, useRef, useEffect } from "react"
import { Link } from "@refly-packages/ai-workspace-common/utils/router"
import Logo from "@/assets/logo.svg"

import "./header.scss"
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
import { useTranslation } from "react-i18next"
import { Button } from "@arco-design/web-react"
import { IconDown } from "@arco-design/web-react/icon"
// components
import { UILocaleList } from "@refly-packages/ai-workspace-common/components/ui-locale-list"

function Header(props: { showLogin?: boolean }) {
  const { showLogin = true } = props
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const userStore = useUserStore()

  const trigger = useRef(null)
  const mobileNav = useRef(null)

  // i18n
  const { t } = useTranslation()

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  const showDashboardBtn =
    storageUserProfile?.uid || userStore?.userProfile?.uid

  // close the mobile menu on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!mobileNav.current || !trigger.current) return
      if (
        !mobileNavOpen ||
        mobileNav.current.contains(target) ||
        trigger.current.contains(target)
      )
        return
      setMobileNavOpen(false)
    }
    document.addEventListener("click", clickHandler)
    return () => document.removeEventListener("click", clickHandler)
  })

  // close the mobile menu if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!mobileNavOpen || keyCode !== 27) return
      setMobileNavOpen(false)
    }
    document.addEventListener("keydown", keyHandler)
    return () => document.removeEventListener("keydown", keyHandler)
  })

  return (
    <header className="absolute z-30 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Site branding */}
          <div className="mr-4 shrink-0">
            {/* Logo */}
            <Link to="/" className="block" aria-label="Cruip">
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

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:grow">
            {/* Desktop sign in links */}
            <ul className="flex grow flex-wrap items-center justify-end">
              <UILocaleList>
                <Button type="text" className="landing-page-language-btn">
                  {t("language")} <IconDown />
                </Button>
              </UILocaleList>

              {showLogin && !showDashboardBtn && (
                <li>
                  <Link
                    onClick={() => {
                      userStore.setLoginModalVisible(true)
                    }}
                    to=""
                    className="flex items-center px-4 py-3 font-medium text-green-600 transition duration-150 ease-in-out hover:text-gray-200">
                    {t("landingPage.loginBtn")}
                  </Link>
                </li>
              )}
              {showDashboardBtn && (
                <li>
                  <Link
                    to="/"
                    className="btn-sm ml-3 bg-green-600 text-white hover:bg-green-700">
                    {t("landingPage.dashboard")}
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            {/* Hamburger button */}
            <button
              ref={trigger}
              className={`hamburger ${mobileNavOpen && "active"}`}
              aria-controls="mobile-nav"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              <span className="sr-only">Menu</span>
              <svg
                className="h-6 w-6 fill-current text-gray-300 transition duration-150 ease-in-out hover:text-gray-200"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <rect y="4" width="24" height="2" rx="1" />
                <rect y="11" width="24" height="2" rx="1" />
                <rect y="18" width="24" height="2" rx="1" />
              </svg>
            </button>

            {/*Mobile navigation */}
            <nav
              id="mobile-nav"
              ref={mobileNav}
              className="absolute left-0 top-full z-20 w-full overflow-hidden px-4 transition-all duration-300 ease-in-out sm:px-6"
              style={
                mobileNavOpen
                  ? { maxHeight: mobileNav.current.scrollHeight, opacity: 1 }
                  : { maxHeight: 0, opacity: 0.8 }
              }>
              <ul className="bg-gray-800 px-4 py-2">
                <li>
                  <Link
                    onClick={() => {
                      userStore.setLoginModalVisible(true)
                    }}
                    to=""
                    className="flex w-full justify-center py-2 font-medium text-green-600 hover:text-gray-200">
                    {t("landingPage.loginBtn")}
                  </Link>
                </li>
                {/* <li>
                  <Link
                    to="/signup"
                    className="inline-flex justify-center items-center px-4 py-2 my-2 w-full font-medium text-white bg-green-600 rounded-sm border border-transparent transition duration-150 ease-in-out hover:bg-green-700">
                    Sign up
                  </Link>
                </li> */}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
