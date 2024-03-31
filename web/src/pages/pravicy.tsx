import Header from "@/components/landing-page-partials/Header"
import PageIllustration from "@/components/landing-page-partials/PageIllustration"
import HeroHome from "@/components/landing-page-partials/HeroHome"
import FeaturesBlocks from "@/components/landing-page-partials/FeaturesBlocks"
import FeaturesZigZag from "@/components/landing-page-partials/FeaturesZigzag"
import Testimonials from "@/components/landing-page-partials/Testimonials"
import Newsletter from "@/components/landing-page-partials/Newsletter"
import Banner from "@/components/landing-page-partials/Banner"
import Footer from "@/components/landing-page-partials/Footer"
import { Markdown } from "@/components/markdown"

const pravicyMdText = `# ReflyAI Privacy Policy

> Effective Date: March 26, 2024

At ReflyAI, we are committed to protecting the privacy and security of our users. This Privacy Policy describes the types of information we may collect from you or that you may provide when you use our AI Search Engine ("Service") and our practices for collecting, using, maintaining, protecting, and disclosing that information.

## Information We Collect

## Information You Provide to Us

- **Account Information**: If you create an account, we may collect your name, email address, and password.
- **Search Queries**: We collect the search queries you input into our Service to provide search results and improve our Service.
- **Browser History**: If you use our service, we may collect your browser history to provide personalized search results and improve our service. Browser history includes information such as the web pages you visit, links you click on, and features you use. We implement security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. We retain your personal data for the duration required by law and do not sell your personal data to third parties. You have the right to access, update, and delete your personal data, as well as manage your preferences and choices. If you have any questions or concerns, please contact us. We may update this privacy policy periodically, and we will notify you of any significant changes and obtain your consent if required by law.

## Information We Collect Automatically

- **Usage Details**: When you access and use our Service, we automatically collect details of your access to and use of our Service, including traffic data, location data, logs, and other communication data and the resources that you access and use on or through our Service.
- **Device Information**: We collect information about your device, including IP address, operating system, browser type, and device identifiers.

## Cookies and Tracking Technologies

- We use cookies and similar tracking technologies to track activity on our Service and hold certain information.

## Payment Information

- **Payment and Billing Information**: If you purchase a subscription or service from us, we may collect payment and billing information. This includes your credit card number, billing address, and other information necessary for processing payments. We use secure payment processing services to handle transactions and do not store your credit card information on our servers.

## Information We Do Not Collect 

- **Sensitive Personal Information**: We do not collect sensitive personal information such as Social Security numbers, genetic data, health information, or religious beliefs.

## How We Use Your Information

We use the information we collect about you or that you provide to us, including any personal information:

- To provide you with our Service and its contents, and any other information, products or services that you request from us.
- To fulfill the purposes for which you provided the information or that were described when it was collected, or any other purpose for which you provide it.
- To give you notices about your account and subscription, including expiration and renewal notices.
- To carry out our obligations and enforce our rights arising from any contracts entered into between you and us, including for billing and collection.
- To notify you about changes to our Service or any products or services we offer or provide through it.
- To improve our Service, products, and services, and to develop new ones.
- To measure or understand the effectiveness of the advertising we serve to you and others, and to deliver relevant advertising to you.
- For any other purpose with your consent.

## Data Security

We implement measures designed to protect your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, the transmission of information via the internet is not completely secure, and we cannot guarantee the security of your personal information transmitted to our Service.

## Changes to Our Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.

## Contact Information

To ask questions or comment about this Privacy Policy and our privacy practices, contact us at: pftom@qq.com.`

const Privacy = () => {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/*  Site header */}
      <Header showLogin={false} />

      {/*  Page content */}
      <main className="grow">
        {/*  Page illustration */}
        <div
          className="relative max-w-6xl mx-auto h-0 pointer-events-none"
          aria-hidden="true">
          <PageIllustration />
        </div>

        <section>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            <div className="relative pt-24 pb-10 md:pt-32 md:pb-16">
              <Markdown content={pravicyMdText} />
            </div>
          </div>
        </section>
      </main>

      {/*  Site footer */}
      <Footer />
    </div>
  )
}

export default Privacy
