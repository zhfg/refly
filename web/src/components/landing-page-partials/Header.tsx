import { useUserStore } from "@/stores/user"
import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import Logo from "@/assets/logo.svg"

import "./header.scss"
import { safeParseJSON } from "@/utils/parse"
import { useTranslation } from "react-i18next"
import { Button } from "@arco-design/web-react"
import { IconDown } from "@arco-design/web-react/icon"
// components
import { UILocaleList } from "@/components/ui-locale-list"

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
  const showDashboardBtn = storageUserProfile?.id || userStore?.userProfile?.id
  console.log("storageUserProfile", storageUserProfile, userStore?.userProfile)

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
    <header className="absolute w-full z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Site branding */}
          <div className="shrink-0 mr-4">
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
            <ul className="flex grow justify-end flex-wrap items-center">
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
                    className="font-medium text-green-600 hover:text-gray-200 px-4 py-3 flex items-center transition duration-150 ease-in-out">
                    {t("landingPage.loginBtn")}
                  </Link>
                </li>
              )}
              {showDashboardBtn && (
                <li>
                  <Link
                    to="/"
                    className="btn-sm text-white bg-green-600 hover:bg-green-700 ml-3">
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
                className="w-6 h-6 fill-current text-gray-300 hover:text-gray-200 transition duration-150 ease-in-out"
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
              className="absolute top-full z-20 left-0 w-full px-4 sm:px-6 overflow-hidden transition-all duration-300 ease-in-out"
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
                    className="flex font-medium w-full text-green-600 hover:text-gray-200 py-2 justify-center">
                    {t("landingPage.loginBtn")}
                  </Link>
                </li>
                {/* <li>
                  <Link
                    to="/signup"
                    className="font-medium w-full inline-flex items-center justify-center border border-transparent px-4 py-2 my-2 rounded-sm text-white bg-green-600 hover:bg-green-700 transition duration-150 ease-in-out">
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
