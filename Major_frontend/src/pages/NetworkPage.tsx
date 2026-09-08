import HeroSection from '../components/HeroSection';
import Navbar from '../components/Navbar';

export default function NetworkPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <div className="flex h-screen flex-col overflow-hidden">
        <Navbar />
        <HeroSection />
      </div>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[88rem]">
          <h2
            className="text-4xl font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="network-headline"
          >
            VentureLens Intelligence Network
          </h2>
          <p
            className="mt-6 max-w-2xl text-xl text-black/70"
            data-editable
            data-preset-text="network-body"
          >
            Specialized multi-agent analysis, grounded RAG verification, and institutional benchmarks—VentureLens delivers structured, evidence-backed evaluation across every startup dimension.
          </p>
        </div>
      </section>
    </div>
  );
}
