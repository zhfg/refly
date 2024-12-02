import Header from "@/components/landing-page-partials/Header"
import HeroHome from "@/components/landing-page-partials/HeroHome"
import FeaturesBlocks from "@/components/landing-page-partials/FeaturesBlocks"
import Footer from "@/components/landing-page-partials/Footer"

function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#FCFCF9]">
      {/*  Site header */}
      <Header />

      {/*  Page content */}
      <main className="grow">
        <HeroHome />
        <FeaturesBlocks />
      </main>

      {/*  Site footer */}
      <Footer />
    </div>
  )
}

export default Home
