import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"

import Logo from "@/assets/logo.svg"

const Privacy = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col overflow-hidden font-sans">
      <Helmet>
        <title>
          {t("privacyPage.title")} · {t("productName")}
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
              <h1 id="reflyai-privacy-policy">Privacy Policy</h1>
              <blockquote>
                <p>Effective Date: March 26, 2024</p>
              </blockquote>
              <p>
                At ReflyAI, we are committed to protecting the privacy and
                security of our users. This Privacy Policy describes the types
                of information we may collect from you or that you may provide
                when you use our AI Search Engine (&quot;Service&quot;) and our
                practices for collecting, using, maintaining, protecting, and
                disclosing that information.
              </p>
              <h2 id="information-we-collect">Information We Collect</h2>
              <h2 id="information-you-provide-to-us">
                Information You Provide to Us
              </h2>
              <ul>
                <li>
                  <strong>Account Information</strong>: If you create an
                  account, we may collect your name, email address, and
                  password.
                </li>
                <li>
                  <strong>Search Queries</strong>: We collect the search queries
                  you input into our Service to provide search results and
                  improve our Service.
                </li>
                <li>
                  <strong>Browser History</strong>: If you use our service, we
                  may collect your browser history to provide personalized
                  search results and improve our service. Browser history
                  includes information such as the web pages you visit, links
                  you click on, and features you use. We implement security
                  measures to protect your personal data from unauthorized
                  access, alteration, disclosure, or destruction. We retain your
                  personal data for the duration required by law and do not sell
                  your personal data to third parties. You have the right to
                  access, update, and delete your personal data, as well as
                  manage your preferences and choices. If you have any questions
                  or concerns, please contact us. We may update this privacy
                  policy periodically, and we will notify you of any significant
                  changes and obtain your consent if required by law.
                </li>
              </ul>
              <h2 id="information-we-collect-automatically">
                Information We Collect Automatically
              </h2>
              <ul>
                <li>
                  <strong>Usage Details</strong>: When you access and use our
                  Service, we automatically collect details of your access to
                  and use of our Service, including traffic data, location data,
                  logs, and other communication data and the resources that you
                  access and use on or through our Service.
                </li>
                <li>
                  <strong>Device Information</strong>: We collect information
                  about your device, including IP address, operating system,
                  browser type, and device identifiers.
                </li>
              </ul>
              <h2 id="cookies-and-tracking-technologies">
                Cookies and Tracking Technologies
              </h2>
              <ul>
                <li>
                  We use cookies and similar tracking technologies to track
                  activity on our Service and hold certain information.
                </li>
              </ul>
              <h2 id="payment-information">Payment Information</h2>
              <ul>
                <li>
                  <strong>Payment and Billing Information</strong>: If you
                  purchase a subscription or service from us, we may collect
                  payment and billing information. This includes your credit
                  card number, billing address, and other information necessary
                  for processing payments. We use secure payment processing
                  services to handle transactions and do not store your credit
                  card information on our servers.
                </li>
              </ul>
              <h2 id="information-we-do-not-collect">
                Information We Do Not Collect
              </h2>
              <ul>
                <li>
                  <strong>Sensitive Personal Information</strong>: We do not
                  collect sensitive personal information such as Social Security
                  numbers, genetic data, health information, or religious
                  beliefs.
                </li>
              </ul>
              <h2 id="how-we-use-your-information">
                How We Use Your Information
              </h2>
              <p>
                We use the information we collect about you or that you provide
                to us, including any personal information:
              </p>
              <ul>
                <li>
                  To provide you with our Service and its contents, and any
                  other information, products or services that you request from
                  us.
                </li>
                <li>
                  To fulfill the purposes for which you provided the information
                  or that were described when it was collected, or any other
                  purpose for which you provide it.
                </li>
                <li>
                  To give you notices about your account and subscription,
                  including expiration and renewal notices.
                </li>
                <li>
                  To carry out our obligations and enforce our rights arising
                  from any contracts entered into between you and us, including
                  for billing and collection.
                </li>
                <li>
                  To notify you about changes to our Service or any products or
                  services we offer or provide through it.
                </li>
                <li>
                  To improve our Service, products, and services, and to develop
                  new ones.
                </li>
                <li>
                  To measure or understand the effectiveness of the advertising
                  we serve to you and others, and to deliver relevant
                  advertising to you.
                </li>
                <li>For any other purpose with your consent.</li>
              </ul>
              <h2 id="data-security">Data Security</h2>
              <p>
                We implement measures designed to protect your personal
                information from accidental loss and from unauthorized access,
                use, alteration, and disclosure. However, the transmission of
                information via the internet is not completely secure, and we
                cannot guarantee the security of your personal information
                transmitted to our Service.
              </p>
              <h2 id="changes-to-our-privacy-policy">
                Changes to Our Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page. You are advised to review this Privacy Policy
                periodically for any changes.
              </p>
              <h2 id="contact-information">Contact Information</h2>
              <p>
                To ask questions or comment about this Privacy Policy and our
                privacy practices, contact us at:{" "}
                <a href="mailto:support@refly.ai">support@refly.ai</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Privacy
