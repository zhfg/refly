import { Helmet } from 'react-helmet';
import ArtifactGallery from '@/components/landing-page-partials/artifact-gallery';
import Header from '@/components/landing-page-partials/Header';
import Footer from '@/components/landing-page-partials/Footer';

function ArtifactGallary() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#FFFFFF]">
      <Helmet>
        <title>Refly Spaces Gallery</title>
        <meta
          name="description"
          content="Discover and explore incredible spaces created with Refly."
        />
        <meta property="og:title" content="Refly Spaces Gallery" />
        <meta
          property="og:description"
          content="Discover and explore incredible spaces created with Refly."
        />
        <meta property="og:image" content="https://static.refly.ai/landing/product-og-min.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      {/* Site header */}
      <Header />

      {/* Main content */}
      <main className="grow">
        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl pt-20 pb-10 px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Manus Spaces gallery</h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Discover and explore incredible Spaces created with Manus.
            </p>
          </div>
        </section>

        {/* Gallery with all items and no view more button */}
        <ArtifactGallery
          maxItems={24}
          showViewMore={false}
          title="All Spaces"
          description="Browse our complete collection of Spaces created by the community"
          showHeader={false}
        />
      </main>

      {/* Site footer */}
      <Footer />
    </div>
  );
}

export default ArtifactGallary;
