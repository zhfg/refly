import React, { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import Logo from "@/assets/logo.svg"

function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const trigger = useRef<HTMLButtonElement>(null)
  const mobileNav = useRef<HTMLElement>(null)

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
    <header className="fixed top-0 z-20 mx-6 flex w-full justify-center backdrop-blur-lg">
      <div
        className="relative flex w-full max-w-4xl items-center justify-between py-4"
        style={{ paddingLeft: 0, paddingRight: 30 }}>
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
        <nav className="hidden md:flex md:grow">
          {/* Desktop sign in links */}
          <ul className="flex grow flex-wrap items-center justify-end gap-2">
            <li>
              <Link
                to="/signin"
                className="text-textGray undefined undefined bg-elementGray flex h-[1.9rem] items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold ease-in">
                登录
              </Link>
            </li>
            <li>
              <Link
                to="/signup"
                className="undefined undefined flex h-[1.9rem] items-center gap-1.5 whitespace-nowrap rounded-md bg-black px-2.5 text-sm font-semibold text-white ease-in">
                注册
              </Link>
            </li>
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
                ? {
                    maxHeight: mobileNav.current?.scrollHeight || 0,
                    opacity: 1,
                  }
                : { maxHeight: 0, opacity: 0.8 }
            }>
            <ul className="bg-gray-800 px-4 py-2">
              <li>
                <Link
                  to="/signin"
                  className="flex w-full justify-center py-2 font-medium text-purple-600 hover:text-gray-200">
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="my-2 inline-flex w-full items-center justify-center rounded-sm border border-transparent bg-purple-600 px-4 py-2 font-medium text-white transition duration-150 ease-in-out hover:bg-purple-700">
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
