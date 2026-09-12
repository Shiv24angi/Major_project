import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import InfoSection from '../components/InfoSection';
import BackedBySection from '../components/BackedBySection';
import HowItWorksSection from '../components/HowItWorksSection';
import AnalysisDimensionsSection from '../components/AnalysisDimensionsSection';
import MultiAgentSection from '../components/MultiAgentSection';
import EvidenceRagSection from '../components/EvidenceRagSection';
import InvestmentScoreSection from '../components/InvestmentScoreSection';
import InputsSection from '../components/InputsSection';
import InvestorWorkflowSection from '../components/InvestorWorkflowSection';
import ComparisonSection from '../components/ComparisonSection';
import UseCasesSection from '../components/UseCasesSection';
import CtaSection from '../components/CtaSection';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black">
      <Navbar />
      <main>
        <HeroSection />
        <InfoSection />
        <BackedBySection />
        <HowItWorksSection />
        <AnalysisDimensionsSection />
        <MultiAgentSection />
        <EvidenceRagSection />
        <InvestmentScoreSection />
        <InputsSection />
        <InvestorWorkflowSection />
        <ComparisonSection />
        <UseCasesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
