import React, { useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"

import "aos/dist/aos.css"
import "@/styles/style.css"

import AOS from "aos"

import Home from "./Home"
import SignIn from "./SignIn"
import SignUp from "./SignUp"
import ResetPassword from "./ResetPassword"

function LandingPage() {
  const location = useLocation()

  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 600,
      easing: "ease-out-sine",
    })
  })

  useEffect(() => {
    document.querySelector("html").style.scrollBehavior = "auto"
    window.scroll({ top: 0 })
    document.querySelector("html").style.scrollBehavior = ""
  }, [location.pathname]) // triggered on route change

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  )
}

export default LandingPage
