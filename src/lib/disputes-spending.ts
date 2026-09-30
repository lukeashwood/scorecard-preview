/* Government spending, inflation and rate rises. Every quote here was checked against the page it is attributed to
   on 1 October 2026. Headline figures are read from the site's own data at build time, so they move when the data does. */
import raw from '../data/metrics.json';
import type { Controversy } from './controversies';

const metrics = (raw as any).metrics as any[];
const byId = (id: string) => metrics.find((m) => m.id === id);
const lastOf = (id: string, i = 0) => { const s = byId(id)?.chart?.series?.[i]?.points as [string, number][] | undefined; return s ? s[s.length - 1] : null; };
const cash = lastOf('interest_rates');
const infl = byId('inflation')?.headline;
const spend = byId('spending_gdp')?.headline;
const pubDemand = byId('government_size')?.headline;
const pct = (v?: number, d = 1) => (v == null ? 'n/a' : `${v.toFixed(d)}%`);

export const SPENDING_INFLATION: Controversy = {
  id: 'spending-inflation-rate-rises', featured: true, date: '2026-09-29', type: 'policy', category: 'Budget and inflation',
  title: 'Is government spending pushing up inflation and interest rates?',
  minister: 'Jim Chalmers and Katy Gallagher', portfolio: 'Treasurer; Minister for Finance',
  summary: 'The Reserve Bank lifted the cash rate to 4.60% on 29 September 2026, its fourth rise this year and the highest level in 15 years. A number of prominent economists, including former Reserve Bank Governor Philip Lowe, say heavy federal spending is adding to demand and to inflation, and that the budget should be in surplus at full employment. The Final Budget Outcome, released the day before, showed Commonwealth spending at 26.9% of GDP in 2025-26, the highest share in 40 years outside the COVID years. The Treasurer and Finance Minister say the main driver of inflation now is the war in the Middle East and strong private demand, not government spending.',
  figures: [
    // The 29 September decision is entered by hand: the RBA's data table can lag its announcement by days.
    { label: 'Cash rate', value: pct(Math.max(cash?.[1] ?? 0, 4.6), 2), note: 'RBA cash rate target after the 29 September 2026 decision' },
    { label: 'Inflation', value: pct(infl?.value), note: `Annual CPI, ${infl?.period ?? 'latest month'}. RBA target is 2 to 3%.` },
    { label: 'Commonwealth spending', value: pct(spend?.value), note: `Share of GDP, ${spend?.period ?? 'latest year'}` },
    { label: 'Public demand, all governments', value: pct(pubDemand?.value), note: `Share of the economy, ${pubDemand?.period ?? 'latest quarter'}` },
  ],
  points: [
    { heading: 'Inflation was already too high before the Middle East war', standing: 'established',
      body: 'This is the Reserve Bank’s own account. In March, Governor Michele Bullock said “inflation was already too high”. After the September rise she said the bank “did start from a position of excess demand anyway”, which is why it began raising rates “even before the conflict started”. The first rise of 2026, on 3 February, came before the war began.',
      sources: [
        { title: 'RBA media conference, 29 September 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-09-29.html' },
        { title: 'RBA media conference, 17 March 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-03-17.html' },
      ] },
    { heading: 'Government spending adds to demand, and so to inflation pressure', standing: 'established',
      body: 'On the mechanics there is no dispute. Asked about it in March, Bullock said “if G goes up, then that adds to aggregate demand”, G being government spending. In September she said public and private demand “are both adding to aggregate demand”. What is disputed is how big the government’s share of the problem is, and whether spending is too high.',
      sources: [
        { title: 'RBA media conference, 17 March 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-03-17.html' },
        { title: 'RBA media conference, 29 September 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-09-29.html' },
      ] },
    { heading: 'The Reserve Bank says government spending is too high', standing: 'unverified',
      body: 'The bank has not said this. Bullock has repeatedly declined to judge fiscal policy. In March she told a reporter “you’re asking me to make a value judgment which I’m not going to make”, and in September she said she was not there “to blame the AI boom or public demand or consumers”. The bank’s February Statement on Monetary Policy put the late 2025 pick up in inflation down mainly to stronger than expected private demand.',
      sources: [
        { title: 'RBA media conference, 17 March 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-03-17.html' },
        { title: 'RBA media conference, 29 September 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-09-29.html' },
        { title: 'RBA Statement on Monetary Policy, February 2026: Economic conditions', url: 'https://www.rba.gov.au/publications/smp/2026/feb/economic-conditions.html' },
      ] },
    { heading: 'Economists who say spending is the problem', standing: 'contested',
      body: 'Former RBA Governor Philip Lowe said on a podcast released on 29 September that Australia is “running sizeable budget deficits at a time where we’re at full employment”, and argued for surpluses. UNSW economist Richard Holden has argued that spending as a share of GDP has risen by nearly 2.5 percentage points. Others disagree about the weight: independent economist Chris Richardson describes the problem as too much money across the whole economy, and ABC analysis notes the OECD puts Australia’s deficit around the middle of advanced economies. No survey was found showing most economists blame government spending.',
      sources: [
        { title: 'Treasurer’s spending slammed by ex-central bank boss (AAP, 30 September 2026)', url: 'https://www.macleayargus.com.au/story/9359843/treasurers-spending-slammed-by-ex-central-bank-boss/' },
        { title: 'Treasurer Jim Chalmers denies high government spending is fuelling inflation (The Nightly, 30 September 2026)', url: 'https://thenightly.com.au/politics/treasurer-jim-chalmers-denies-high-government-spending-is-fuelling-inflation-c-22946549' },
        { title: 'Australia’s rising interest rates are not just down to government spending (ABC, 29 September 2026)', url: 'https://www.abc.net.au/news/2026-09-29/rba-decision-on-interest-rates-janda-analysis/107206522' },
      ] },
    { heading: 'Spending is at a record share of the economy', standing: 'unverified',
      body: 'Close, but not a record. Commonwealth payments were 26.9% of GDP in 2025-26. That is the highest since 1985-86 if the COVID years are left out, but spending reached 31.3% in 2020-21 and 27.5% in 1984-85. It has risen every year from 24.3% in 2022-23. See the Government spending chart for the full series back to 1970-71.',
      sources: [
        { title: 'Final Budget Outcome 2025-26', url: 'https://archive.budget.gov.au/2025-26/fbo/download/00_fbo_2025-26.pdf' },
        { title: 'Budget Paper No. 1 2026-27, Statement 11, Table 11.1', url: 'https://budget.gov.au/content/bp1/download/bp1_bs-11.pdf' },
      ] },
    { heading: 'What the government says', standing: 'established',
      body: 'Jim Chalmers said on 28 September that “a big driver of the inflation we’re seeing” comes from the Middle East, while accepting there was “an inflation challenge in our economy, made much worse by the war”. He says four out of every five dollars of demand added over the past year came from the private sector, and that he has taken responsibility for his part in the fight against inflation. Katy Gallagher told the Senate on 16 September that cost of living support “was done in a targeted way that didn’t add to the inflation challenge”. Neither has said spending plays no part; both reject the claim that it is the main cause.',
      sources: [
        { title: 'Treasurer Jim Chalmers defends inflation record as 15-year interest rate high looms (ABC, 28 September 2026)', url: 'https://www.abc.net.au/news/2026-09-28/chalmers-interest-rates-cost-of-living-households-mortgage/107203392' },
        { title: 'Labor defends economic record following interest rate hike (ABC, 30 September 2026)', url: 'https://www.abc.net.au/news/2026-09-30/labor-defends-spending-amid-high-inflation-rate-rise/107208962' },
        { title: 'Senate debates, 16 September 2026 (Hansard via OpenAustralia)', url: 'https://www.openaustralia.org.au/senate/?id=2026-09-16.108.1&m=100241' },
      ] },
  ],
  response: 'The Treasurer says the war in the Middle East is the big driver of current inflation and that most new demand is coming from the private sector. The Finance Minister says cost of living support was targeted so it would not add to inflation. The government points to a 2025-26 deficit of $22.3 billion, smaller than forecast.',
  outcome: 'Ongoing. The Opposition says the government has not tightened its own belt while households have. The Reserve Bank says it takes government spending as given and sets rates for total demand.',
  status: 'ongoing',
  sources: [
    { title: 'RBA media conference, 29 September 2026', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-09-29.html' },
    { title: 'Final Budget Outcome 2025-26', url: 'https://archive.budget.gov.au/2025-26/fbo/download/00_fbo_2025-26.pdf' },
    { title: 'Labor defends economic record following interest rate hike (ABC, 30 September 2026)', url: 'https://www.abc.net.au/news/2026-09-30/labor-defends-spending-amid-high-inflation-rate-rise/107208962' },
    { title: 'Treasurer’s spending slammed by ex-central bank boss (AAP, 30 September 2026)', url: 'https://www.macleayargus.com.au/story/9359843/treasurers-spending-slammed-by-ex-central-bank-boss/' },
  ],
  verified_on: '2026-10-01',
};
