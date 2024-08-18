import React, { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import Logo from "@/assets/logo.svg"
import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"
import { getClientOrigin } from "@refly/utils/url"
import { IENV, getEnv } from "@refly/utils/env"

function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const userStore = useUserStore()

  const trigger = useRef<HTMLButtonElement>(null)
  const mobileNav = useRef<HTMLElement>(null)
  const isDev = getEnv() === IENV.DEVELOPMENT

  // close the mobile menu on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!mobileNav.current || !trigger.current) return
      if (
        !mobileNavOpen ||
        mobileNav.current.contains(target) ||
        trigger.current?.contains(target)
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
    <header className="fixed top-0 z-20 flex w-full justify-center px-6 backdrop-blur-lg sm:px-2 md:px-2 lg:px-0">
      <div className="relative flex w-full max-w-4xl items-center justify-between py-4">
        <div className="mr-4 shrink-0" style={{ height: 45 }}>
          {/* Logo */}
          <Link
            to="/"
            className="flex flex-row items-center"
            aria-label="Cruip">
            <img src={Logo} style={{ width: 35 }} />
            <span style={{ fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
              Refly
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="md:flex md:grow">
          {/* Desktop sign in links */}
          <ul className="flex grow flex-wrap items-center justify-end gap-2">
            <li>
              <button
                onClick={() => {
                  userStore.setWaitingListModalVisible(true)
                }}
                className="text-textGray undefined undefined bg-elementGray flex h-[1.9rem] items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold ease-in">
                登录
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  userStore.setWaitingListModalVisible(true)
                }}
                className="undefined undefined flex h-[1.9rem] items-center gap-1.5 whitespace-nowrap rounded-md bg-black px-2.5 text-sm font-semibold text-white ease-in">
                注册
              </button>
            </li>
            {isDev ? (
              <li>
                <button
                  onClick={() => {
                    userStore.setLoginModalVisible(true)
                  }}
                  className="undefined undefined flex h-[1.9rem] items-center gap-1.5 whitespace-nowrap rounded-md bg-black px-2.5 text-sm font-semibold text-white ease-in">
                  本地登录
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
