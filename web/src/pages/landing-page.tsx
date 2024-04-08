import React, { useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"

import "aos/dist/aos.css"
import "@/styles/style.css"

import AOS from "aos"

import Home from "./Home"
import SignIn from "./SignIn"
import SignUp from "./SignUp"
import ResetPassword from "./ResetPassword"
import Privacy from "./pravicy"
import Terms from "./terms"

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
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </>
  )
}

export default LandingPage
