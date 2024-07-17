import React from "react"

import Header from "@/components/landing-page-partials/Header"
import PageIllustration from "@/components/landing-page-partials/PageIllustration"
import HeroHome from "@/components/landing-page-partials/HeroHome"
import FeaturesBlocks from "@/components/landing-page-partials/FeaturesBlocks"
import FeaturesZigZag from "@/components/landing-page-partials/FeaturesZigzag"
import Testimonials from "@/components/landing-page-partials/Testimonials"
import Newsletter from "@/components/landing-page-partials/Newsletter"
import Banner from "@/components/landing-page-partials/Banner"
import Footer from "@/components/landing-page-partials/Footer"
import { useUserStore } from "@refly/ai-workspace-common/stores/user"

function Home() {
  const userStore = useUserStore()

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#FCFCF9]">
      {/*  Site header */}
      <Header />

      {/*  Page content */}
      <main className="grow">
        {/*  Page illustration */}
        {/* <div
          className="relative h-0 max-w-6xl mx-auto pointer-events-none"
          aria-hidden="true">
          <PageIllustration />
        </div> */}

        {/*  Page sections */}
        <HeroHome />
        <FeaturesBlocks />
        {/* <FeaturesZigZag /> */}
        {/* <Testimonials /> */}
        {/* <Newsletter /> */}
      </main>

      {/*  Site footer */}
      <Footer />
    </div>
  )
}

export default Home
