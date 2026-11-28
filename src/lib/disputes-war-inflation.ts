/* "The war is to blame for inflation." Checked 28 November 2026. The country comparison is read from the site's own
   G20 file (IMF consumer price data; Australia from the ABS monthly CPI) at build time, so it moves when the data does.
   New Zealand is not in the G20, so its figure is entered by hand from Stats NZ. */
import g20 from '../data/g20.json';
import type { Controversy } from './controversies';

const NAMES: Record<string, string> = { AUS: 'Australia', USA: 'United States', GBR: 'United Kingdom', CAN: 'Canada', DEU: 'Germany', FRA: 'France', ITA: 'Italy', JPN: 'Japan', KOR: 'South Korea', CHN: 'China' };
const pts = (g20 as any).indicators.inflation.points as Record<string, [number, number][]>;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = (n: number) => `${MONTHS[(n % 100) - 1]} ${Math.floor(n / 100)}`;
const at = (c: string, n: number) => pts[c]?.find((p) => p[0] === n)?.[1];

/** Latest figure for each advanced economy, plus where it stood at the May 2025 election. */
export const WAR_TABLE = Object.keys(NAMES).filter((c) => pts[c]?.length).map((c) => {
  const last = pts[c][pts[c].length - 1];
  const may25 = at(c, 202505);
  return { code: c, name: NAMES[c], value: Math.round(last[1] * 10) / 10, month: ym(last[0]), rise: may25 == null ? null : Math.round((last[1] - may25) * 10) / 10 };
});
// New Zealand: Stats NZ, CPI annual change to the September 2026 quarter (published 22 October 2026).
WAR_TABLE.push({ code: 'NZL', name: 'New Zealand', value: 3.7, month: 'Sep qtr 2026', rise: null });
WAR_TABLE.sort((a, b) => b.value - a.value);

const aus = WAR_TABLE.find((r) => r.code === 'AUS')!;
const others = WAR_TABLE.filter((r) => r.code !== 'AUS' && r.code !== 'CHN');
const china = WAR_TABLE.find((r) => r.code === 'CHN');
const next = others[0];
const higher = others.filter((r) => r.value >= aus.value).length;
const list = others.map((r) => `${r.name} ${r.value.toFixed(1)}%`).join(', ') + (china ? `. China is at ${china.value.toFixed(1)}%` : '');
const biggestRise = WAR_TABLE.filter((r) => r.rise != null).sort((a, b) => b.rise! - a.rise!)[0];

export const WAR_INFLATION: Controversy = {
  id: 'war-to-blame-for-inflation', featured: true, date: '2026-11-25', type: 'policy', category: 'Budget and inflation',
  title: 'The government says the war is to blame for high inflation. Then why is Australia’s worse than every other major economy?',
  minister: 'Jim Chalmers', portfolio: 'Treasurer',
  summary: `The Treasurer says the war in the Middle East, which closed the Strait of Hormuz and sent oil prices soaring, is the main reason inflation is high. But every country paid the same world oil price. On the latest figures Australia’s inflation is ${aus.value.toFixed(1)}% (${aus.month}), ${higher === 0 ? 'higher than any other major advanced economy' : 'among the highest of the major advanced economies'}: ${list}. If the war were the main cause, Australia would not stand out. It does.`,
  figures: [
    { label: 'Australia', value: `${aus.value.toFixed(1)}%`, note: `Annual CPI inflation, ${aus.month} (ABS)` },
    { label: `Next highest: ${next.name}`, value: `${next.value.toFixed(1)}%`, note: `Annual CPI inflation, ${next.month}` },
    { label: 'Rise since the May 2025 election', value: `+${aus.rise?.toFixed(1)} pts`, note: `Australia, from ${(aus.value - (aus.rise ?? 0)).toFixed(1)}% in May 2025` },
    { label: 'RBA cash rate', value: '4.85%', note: '18-year high, after the fifth rise of 2026' },
  ],
  points: [
    { heading: 'Every country faced the same oil shock', standing: 'established',
      body: 'Oil is priced on a world market. After the US and Israel attacked Iran in early 2026, the effective closure of the Strait of Hormuz lifted world oil prices by 40 to 50%, according to SBS reporting. Every country paid that price, and inflation rose in most major economies (see the table). In New Zealand, petrol was the largest single contributor to inflation in the September 2026 quarter.',
      sources: [
        { title: 'Government modelling ‘more drastic’ fuel scenario, Chalmers says, as war rages on (SBS)', url: 'https://www.sbs.com.au/news/article/jim-chalmers-treasurer-budget-preview-middle-east-war/8557kwm6a' },
        { title: 'Annual inflation hits 3.7% in the September quarter with petrol continuing to lead the way (interest.co.nz)', url: 'https://www.interest.co.nz/economy/140742/annual-inflation-hits-37-september-quarter-petrol-continuing-lead-way-followed' },
      ] },
    { heading: 'Australia’s inflation is higher than every other major advanced economy', standing: 'established',
      body: `The official figures show it. Australia’s annual inflation was ${aus.value.toFixed(1)}% in ${aus.month}. The latest figures for the other major advanced economies are: ${list}. Since the May 2025 election, Australia’s inflation has risen ${aus.rise?.toFixed(1)} percentage points${biggestRise?.code === 'AUS' ? ', the biggest rise of any of them' : ''}. In October 2026 the IMF forecast that only 6 developed economies, none of them major, would have higher inflation than Australia in 2026: Greece, Bulgaria, Lithuania, Croatia, Iceland and Andorra. Countries publish on different days, so each is shown at its latest month.`,
      sources: [
        { title: 'ABS Monthly Consumer Price Index Indicator', url: 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/monthly-consumer-price-index-indicator/latest-release' },
        { title: 'IMF consumer price data (via the Gov Score G20 comparison)', url: 'https://data.imf.org/' },
        { title: 'Inflation eases to 3.7%, Stats NZ (1News)', url: 'https://www.1news.co.nz/2026/10/22/inflation-eases-to-37-stats-nz/' },
        { title: 'More rate hikes loom as inflation tops rich nation list (AAP, via Illawarra Mercury)', url: 'https://www.illawarramercury.com.au/story/9367676/more-rate-hikes-loom-as-inflation-tops-rich-nation-list/' },
      ] },
    { heading: 'Inflation was already above the target band before the war', standing: 'established',
      body: 'Annual inflation in the ABS monthly CPI was 3.2% in August 2025, above the Reserve Bank’s 2 to 3% band, and 3.8% in December 2025 and January 2026. The Reserve Bank’s first rate rise of 2026, on 3 February, came before the war began.',
      sources: [
        { title: 'ABS Monthly Consumer Price Index Indicator', url: 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/monthly-consumer-price-index-indicator/latest-release' },
        { title: 'RBA cash rate target: decisions', url: 'https://www.rba.gov.au/statistics/cash-rate/' },
      ] },
    { heading: 'The Reserve Bank isn’t raising rates because of oil', standing: 'position',
      body: 'Reserve Bank Governor Michele Bullock, announcing the fifth rate rise of 2026 to 4.85%, said: “I want to be very clear that we are not tightening monetary policy because of the direct impact of oil prices on inflation.” The Nightly reported she pointed to domestic inflation pressures instead.',
      sources: [
        { title: 'New advice reveals why Treasurer Jim Chalmers continues to blame Middle East oil crisis for high inflation (The Nightly)', url: 'https://thenightly.com.au/politics/new-advice-reveals-why-treasurer-jim-chalmers-continues-to-blame-middle-east-oil-crisis-for-high-inflation-c-23118785' },
      ] },
    { heading: 'The war explains why Australia’s inflation is so high', standing: 'unverified',
      body: 'The record does not support this. The war explains why inflation rose in every country in 2026. It does not explain why Australia’s is higher than the United States, the United Kingdom, Canada, Germany, Japan, South Korea, New Zealand and the rest, when they faced the same oil price. The Reserve Bank says it is raising rates because of pressures at home, not oil.',
      sources: [
        { title: 'STEPHEN JOHNSON: Why the Treasurer’s claim about the Middle East oil crisis is really just spin (The Nightly)', url: 'https://thenightly.com.au/politics/us-politics/stephen-johnson-why-the-treasurers-claim-about-the-middle-east-oil-crisis-is-really-just-spin-c-23083206' },
        { title: 'AARON PATRICK: Why Jim Chalmers’ failure to control inflation is world class (The Nightly)', url: 'https://thenightly.com.au/opinion/aaron-patrick-why-jim-chalmers-failure-to-control-inflation-is-world-class-c-22209080' },
      ] },
    { heading: 'What the government says', standing: 'position',
      body: 'On 30 September 2026 Jim Chalmers said “the overwhelming reason why inflation went up in August in headline terms was higher global oil prices”. In a Capital Brief opinion piece on 6 November he wrote that “pretending the war is not the primary driver of higher prices this year would mean disregarding the data”.',
      sources: [
        { title: 'Press conference, Sydney, 30 September 2026 (Treasurer’s transcript)', url: 'https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/transcripts/press-conference-commonwealth-parliamentary-offices-1' },
        { title: 'Opinion piece: The war is driving inflation, but our budget must play its part (Treasurer)', url: 'https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/articles/opinion-piece-war-driving-inflation-our-budget-must-play-its' },
      ] },
  ],
  response: 'The Treasurer says higher world oil prices from the war in the Middle East are the main driver of higher prices this year.',
  outcome: 'Ongoing. Australia’s inflation remains above the Reserve Bank’s 2 to 3% target and above every other major advanced economy.',
  status: 'ongoing',
  sources: [
    { title: 'Opinion piece: The war is driving inflation, but our budget must play its part (Treasurer)', url: 'https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/articles/opinion-piece-war-driving-inflation-our-budget-must-play-its' },
    { title: 'More rate hikes loom as inflation tops rich nation list (AAP)', url: 'https://www.canberratimes.com.au/story/9367676/more-rate-hikes-loom-as-inflation-tops-rich-nation-list/' },
    { title: 'New advice reveals why Treasurer Jim Chalmers continues to blame Middle East oil crisis for high inflation (The Nightly)', url: 'https://thenightly.com.au/politics/new-advice-reveals-why-treasurer-jim-chalmers-continues-to-blame-middle-east-oil-crisis-for-high-inflation-c-23118785' },
  ],
  verified_on: '2026-11-28',
};
