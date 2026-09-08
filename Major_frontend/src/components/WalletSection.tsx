import PillButton from './PillButton';

export default function WalletSection() {
  return (
    <section
      id="wallet"
      className="scroll-mt-24 border-t border-black/5 bg-[#F5F5F5] px-6 py-20"
      aria-label="Wallet"
    >
      <div className="mx-auto max-w-[88rem] text-center">
        <h2
          className="mb-4 text-3xl font-semibold text-black md:text-4xl"
          style={{ letterSpacing: '-0.03em' }}
          data-editable
          data-preset-text="wallet-headline"
        >
          Access Startup Intelligence
        </h2>
        <p
          className="mx-auto mb-8 max-w-md text-base text-black/60"
          data-editable
          data-preset-text="wallet-body"
        >
          Upload startup documentation and generate multi-agent due diligence evaluations.
        </p>
        <PillButton size="base" section="how-it-works" presetText="wallet-cta">
          Start Analysis
        </PillButton>
      </div>
    </section>
  );
}
