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
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"

function LandingPage() {
  const location = useLocation()
  const { t } = useTranslation()

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
      <Helmet>
        <title>{t("landingPage.slogan")}</title>
        <meta name="description" content={t("landingPage.description")} />
      </Helmet>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </>
  )
}

export default LandingPage
