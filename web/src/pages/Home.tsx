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

function Home() {
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
        <FeaturesZigZag />
        <Testimonials />
        <Newsletter />
      </main>

      {/*  Site footer */}
      <Footer />
    </div>
  )
}

export default Home
