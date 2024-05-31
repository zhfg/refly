import React from "react"

import Header from "@refly/ai-workspace-common/components/landing-page-partials/Header"
import PageIllustration from "@refly/ai-workspace-common/components/landing-page-partials/PageIllustration"
import HeroHome from "@refly/ai-workspace-common/components/landing-page-partials/HeroHome"
import FeaturesBlocks from "@refly/ai-workspace-common/components/landing-page-partials/FeaturesBlocks"
import FeaturesZigZag from "@refly/ai-workspace-common/components/landing-page-partials/FeaturesZigzag"
import Testimonials from "@refly/ai-workspace-common/components/landing-page-partials/Testimonials"
import Newsletter from "@refly/ai-workspace-common/components/landing-page-partials/Newsletter"
import Banner from "@refly/ai-workspace-common/components/landing-page-partials/Banner"
import Footer from "@refly/ai-workspace-common/components/landing-page-partials/Footer"
import { useUserStore } from "@refly/ai-workspace-common/stores/user"
import { LoginModal } from "@refly/ai-workspace-common/components/login-modal"

function Home() {
  const userStore = useUserStore()

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/*  Site header */}
      <Header />

      {/*  Page content */}
      <main className="grow">
        {/*  Page illustration */}
        <div
          className="relative max-w-6xl mx-auto h-0 pointer-events-none"
          aria-hidden="true">
          <PageIllustration />
        </div>

        {/*  Page sections */}
        <HeroHome />
        <FeaturesBlocks />
        {/* <FeaturesZigZag /> */}
        {/* <Testimonials /> */}
        {/* <Newsletter /> */}
      </main>

      {/*  Site footer */}
      <Footer />
      {userStore.loginModalVisible ? <LoginModal /> : null}
    </div>
  )
}

export default Home
