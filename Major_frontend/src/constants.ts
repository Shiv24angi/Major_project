export const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4';

export const INFO_CARD_IMAGE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85';

export const USE_CASES_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4';

export const NAV_LINKS = [
  { label: 'Product', path: 'product', section: 'product' },
  { label: 'How It Works', path: 'how-it-works', section: 'how-it-works' },
  { label: 'Analysis', path: 'analysis', section: 'analysis' },
  { label: 'For Investors', path: 'for-investors', section: 'for-investors' },
  { label: 'About', path: 'about', section: 'about' },
] as const;

export type BrandStyle = {
  name: string;
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing: string;
  fontSize: string;
  fontStyle?: string;
  textTransform?: string;
};

export const HERO_BRANDS: BrandStyle[] = [
  { name: 'Sequoia', fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '15px' },
  {
    name: 'a16z',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 900,
    letterSpacing: '0.06em',
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  {
    name: 'Benchmark',
    fontFamily: 'Trebuchet MS, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.01em',
    fontSize: '15px',
    fontStyle: 'italic',
  },
  {
    name: 'Founders Fund',
    fontFamily: 'Courier New, monospace',
    fontWeight: 700,
    letterSpacing: '0.08em',
    fontSize: '13px',
    textTransform: 'uppercase',
  },
  {
    name: 'Bessemer',
    fontFamily: 'Palatino, "Book Antiqua", serif',
    fontWeight: 400,
    letterSpacing: '-0.01em',
    fontSize: '16px',
  },
  {
    name: 'Accel',
    fontFamily: 'Impact, "Arial Narrow", sans-serif',
    fontWeight: 400,
    letterSpacing: '0.04em',
    fontSize: '15px',
  },
  {
    name: 'Y Combinator',
    fontFamily: 'Verdana, sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    fontSize: '13px',
  },
];

export const BACKER_BRANDS: BrandStyle[] = [
  {
    name: 'PitchBook',
    fontFamily: 'Times New Roman, serif',
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontSize: '15px',
  },
  {
    name: 'Crunchbase',
    fontFamily: '"Arial Black", sans-serif',
    fontWeight: 900,
    letterSpacing: '0.05em',
    fontSize: '14px',
  },
  { name: 'GitHub', fontFamily: 'Impact, sans-serif', fontWeight: 700, letterSpacing: '0.05em', fontSize: '17px' },
  { name: 'Carta', fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '16px' },
  {
    name: 'SEC EDGAR',
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  {
    name: 'SignalFire',
    fontFamily: 'Verdana, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontSize: '14px',
  },
  {
    name: 'Techstars',
    fontFamily: 'Courier New, monospace',
    fontWeight: 700,
    letterSpacing: '0.12em',
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  {
    name: 'Stanford Angels',
    fontFamily: 'Palatino, serif',
    fontWeight: 500,
    letterSpacing: '0.03em',
    fontSize: '15px',
  },
];
