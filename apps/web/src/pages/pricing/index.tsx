import { PriceContent } from "@refly-packages/ai-workspace-common/components/settings/subscribe-modal/priceContent"
import Header from "@/components/landing-page-partials/Header"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"
import Footer from "@/components/landing-page-partials/Footer"
import FrequentlyAskedQuestions from "@/components/landing-page-partials/frequently-asked-questions"
const PricingPage = () => {
  const { t } = useTranslation()
  const { isLogin } = useUserStoreShallow(state => ({
    isLogin: state.isLogin,
  }))

  return (
    <div className="box-border h-[100vh] w-full overflow-y-auto bg-white py-20">
      {!isLogin && (
        <>
          <Helmet>
            <title>{t("landingPage.slogan")} · Refly</title>
            <meta name="description" content={t("landingPage.description")} />
          </Helmet>

          <Header />
        </>
      )}
      <div className="mx-auto w-[70%] bg-white">
        <PriceContent source="page" />
      </div>
      {!isLogin && (
        <>
          <FrequentlyAskedQuestions />
          <Footer />
        </>
      )}
    </div>
  )
}

export default PricingPage
