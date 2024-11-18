import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"

import Logo from "@/assets/logo.svg"

const Terms = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Helmet>
        <title>
          {t("termsPage.title")} · {t("productName")}
        </title>
      </Helmet>

      <header>
        <div
          className="m-2 flex cursor-pointer items-center gap-2 p-4"
          onClick={() => window.open("/", "_self")}>
          <img className="h-8 w-8" src={Logo} alt="Refly" />
          <span className="font-sans text-xl font-bold">Refly </span>
        </div>
      </header>

      <main className="grow font-sans">
        <section>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative pb-10 pt-12 md:pb-16">
              <h1 id="reflyai-terms-of-service">Terms of Service</h1>
              <blockquote>
                <p>Effective Date: March 26, 2024</p>
              </blockquote>
              <p>
                Thank you for choosing ReflyAI. These Terms of Service
                (&quot;Terms&quot;) are a legal agreement between you and
                ReflyAI and govern your use of the ReflyAI services including
                our website, mobile apps, and other features or services
                (collectively, the &quot;Service&quot;). By using the Service,
                you agree to be bound by these Terms. If you do not agree to
                these Terms, you must not use the Service.
              </p>
              <h2 id="1-acceptance-of-terms">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Service, you confirm your acceptance
                of these Terms and agree to be bound by them. If you are using
                the Service on behalf of an organization, you are agreeing to
                these Terms for that organization and promising that you have
                the authority to bind that organization to these Terms.
              </p>
              <h2 id="2-changes-to-terms">2. Changes to Terms</h2>
              <p>
                ReflyAI reserves the right, at its sole discretion, to modify or
                replace the Terms at any time. If a revision is material, we
                will provide at least 30 days&#39; notice prior to any new terms
                taking effect. What constitutes a material change will be
                determined at our sole discretion.
              </p>
              <h2 id="3-use-of-the-service">3. Use of the Service</h2>
              <h3 id="account-registration">Account Registration</h3>
              <p>
                You may be required to register for an account to access certain
                features of the Service. You agree to provide accurate, current,
                and complete information during the registration process and to
                update such information to keep it accurate, current, and
                complete.
              </p>
              <h3 id="user-conduct">User Conduct</h3>
              <p>
                You are responsible for all your activity in connection with the
                Service. Any fraudulent, abusive, or otherwise illegal activity
                may be grounds for termination of your right to access or use
                the Service.
              </p>
              <h3 id="intellectual-property">Intellectual Property</h3>
              <p>
                All content provided on the Service, including the design, text,
                graphics, logos, icons, images, and the selection and
                arrangement thereof, is the exclusive property of ReflyAI or its
                licensors and is protected by U.S. and international copyright
                laws.
              </p>
              <h2 id="4-content">4. Content</h2>
              <h3 id="user-generated-content">User-Generated Content</h3>
              <p>
                You may be able to upload, store, or share content through the
                Service. You retain all rights in, and are solely responsible
                for, the user-generated content you post to ReflyAI.
              </p>
              <h3 id="content-use">Content Use</h3>
              <p>
                By posting content on the Service, you grant ReflyAI a
                worldwide, non-exclusive, royalty-free license (with the right
                to sublicense) to use, copy, reproduce, process, translate,
                format, publish, transmit, display, and distribute such content
                in any and all media or distribution methods (now known or later
                developed).
              </p>
              <h2 id="5-disclaimers">5. Disclaimers</h2>
              <p>
                ReflyAI provides the Service on an &quot;as is&quot; and
                &quot;as available&quot; basis. You therefore use the Service at
                your own risk. ReflyAI expressly disclaims any and all
                warranties of any kind, whether express or implied.
              </p>
              <h2 id="6-limitation-of-liability">6. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, in no event will
                ReflyAI, its officers, shareholders, employees, agents,
                directors, subsidiaries, affiliates, successors, assigns,
                suppliers, or licensors be liable for (1) any indirect, special,
                incidental, punitive, exemplary, or consequential damages; (2)
                any loss of use, data, business, or profits (whether direct or
                indirect), in all cases arising out of the use or inability to
                use the Service, regardless of legal theory, without regard to
                whether ReflyAI has been warned of the possibility of those
                damages, and even if a remedy fails of its essential purpose.
              </p>
              <h2 id="7-general">7. General</h2>
              <p>
                These Terms are governed by the laws of the jurisdiction in
                which ReflyAI is located, without regard to its conflict of laws
                rules. The courts in some countries will not apply these
                jurisdiction&#39;s laws to some types of disputes. If you reside
                in one of those countries, then where these jurisdiction&#39;s
                laws are required to apply, the laws of your resident country
                will apply to such disputes related to these Terms.
              </p>
              <h2 id="contact-us">Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us
                at <a href="mailto:support@refly.ai">support@refly.ai</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Terms
