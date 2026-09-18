/* The 5% deposit scheme entry. Its repayment figures are calculated at build time from the site's own ABS and RBA series,
   so they move when the data does. Average earnings are entered by hand from the ABS release named below. */
import raw from '../data/metrics.json';
import type { Controversy } from './controversies';

const AWE = { weekly: 2083.7, period: 'May 2026', url: 'https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/average-weekly-earnings-australia/latest-release' };
const metrics = (raw as any).metrics as any[];
const last = (id: string) => metrics.find((m) => m.id === id).chart.series[0].points.slice(-1)[0] as [string, number];
const price = last('home_prices')[1] * 1000, rate = last('mortgage')[1];
const pay = (loan: number, r: number, n = 360) => { const m = r / 1200; return (loan * m) / (1 - Math.pow(1 + m, -n)); };
const tax = (x: number) => [[18200, 45000, 0.15], [45000, 135000, 0.3], [135000, 190000, 0.37], [190000, Infinity, 0.45]].reduce((t, [lo, hi, rr]) => t + (x > lo ? (Math.min(x, hi) - lo) * rr : 0), 0) + x * 0.02;
const gross = AWE.weekly * 52, net = gross - tax(gross);
const loan95 = price * 0.95, loan80 = price * 0.8, p95 = pay(loan95, rate), p80 = pay(loan80, rate);
const affordable = ((0.3 * gross) / 12 / pay(1, rate)) / 0.95;
const $ = (v: number) => '$' + Math.round(v).toLocaleString('en-AU');
const pc = (v: number) => Math.round(v * 100) + '%';

export const FIVE_PERCENT: Controversy = {
  id: 'five-percent-deposit-scheme', featured: true, date: '2026-04-23', type: 'policy', category: 'Housing policy',
  title: 'The 5% deposit scheme: pushing up the prices it was meant to help people pay?',
  minister: 'Clare O’Neil', portfolio: 'Minister for Housing',
  summary: 'From 1 October 2025 the government opened its 5% deposit scheme to every first home buyer, removing the income limits and the cap on places. The taxpayer guarantees part of the loan, so buyers avoid lenders mortgage insurance. Critics say the scheme adds demand without adding homes, which lifts prices in exactly the part of the market first home buyers shop in; that a 95% loan on today’s prices is beyond an average wage; and that it is open to people who are not citizens. The government says the price effect is tiny and that the scheme gets people into homes years sooner.',
  figures: [
    { label: 'Average dwelling price', value: $(price), note: 'ABS mean price of residential dwellings, latest quarter' },
    { label: 'Loan with a 5% deposit', value: $(loan95), note: `deposit of ${$(price * 0.05)}` },
    { label: 'Repayments', value: `${$(p95)} a month`, note: `30 years at ${rate.toFixed(2)}%, the RBA’s average owner-occupier variable rate` },
    { label: 'Share of an average wage', value: pc((p95 * 12) / net), note: `of take-home pay on average full-time earnings of ${$(gross)} a year` },
  ],
  points: [
    { heading: 'Does it push prices up?', standing: 'contested',
      body: 'That it lifts prices is accepted by the government itself; the argument is over how much. The Housing Minister cited Treasury analysis of “around 0.5 per cent over a 6-year period”. Modelling by Lateral Economics for the Insurance Council of Australia (whose members sell the mortgage insurance the scheme replaces) estimated rises of up to 10% in the first year in the part of the market first home buyers target, leaving a buyer of a $700,000 home $16,100 to $41,300 worse off even after saving the insurance. Six months in, Cotality found homes priced under the scheme’s caps had risen 6.7%, against 3.6% for homes above them; Cotality noted that interest rates and investor demand were also at work.',
      sources: [
        { title: 'Clare O’Neil, ABC Radio National, 1 October 2025 (Treasury: “around 0.5 per cent”)', url: 'https://ministers.treasury.gov.au/ministers/clare-oneil-2025/transcripts/interview-barbara-miller-abc-radio-national' },
        { title: 'Insurance Council of Australia: Home Guarantee expansion will inflate prices, 26 August 2025', url: 'https://insurancecouncil.com.au/resource/home-guarantee-expansion-will-inflate-prices-harm-those-it-aims-to-help/' },
        { title: 'ABC News: scheme found to be fuelling price rises at the lower end, Cotality suggests, 23 April 2026', url: 'https://www.abc.net.au/news/2026-04-23/first-home-buyer-scheme-pushing-up-price-of-cheaper-housing/106593276' },
      ] },
    { heading: 'Can someone on an average wage service the loan?', standing: 'established',
      body: `On official figures, no. The average dwelling costs ${$(price)} (ABS). With a 5% deposit the loan is ${$(loan95)}, and at the average variable rate of ${rate.toFixed(2)}% (RBA) repayments are ${$(p95)} a month. Average full-time earnings are ${$(gross)} a year (ABS, ${AWE.period}), or about ${$(net / 12)} a month after tax, so repayments would take ${pc((p95 * 12) / net)} of one average earner’s take-home pay, and ${pc((p95 * 12) / (2 * net))} of the take-home pay of two. Keeping repayments to 30% of gross income, a common yardstick for mortgage stress, a single average earner could buy a home worth about ${$(affordable)}, which is ${pc(affordable / price)} of the average price. Borrowing 95% instead of 80% also means ${$(p95 - p80)} more a month and about ${$((p95 - p80) * 360 - (loan95 - loan80))} more interest over the loan. Two things cut the other way: first home buyers usually buy well below the average price, and the Reserve Bank said in March 2026 that fewer than 1% of households are in negative equity, while confirming the rise in high-debt lending to first home buyers “can be attributed to” the scheme.`,
      sources: [
        { title: 'ABS: Total Value of Dwellings (mean dwelling price)', url: 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/total-value-dwellings/latest-release' },
        { title: `ABS: Average Weekly Earnings, ${AWE.period} (full-time adult ordinary time earnings, $${AWE.weekly.toFixed(2)} a week)`, url: AWE.url },
        { title: 'RBA: housing lending rates (statistical tables)', url: 'https://www.rba.gov.au/statistics/tables/' },
        { title: 'RBA Financial Stability Review, March 2026: resilience of households', url: 'https://www.rba.gov.au/publications/fsr/2026/mar/resilience-of-australian-households-and-businesses.html' },
      ] },
    { heading: 'Who can use it: citizens only?', standing: 'established',
      body: 'No. The official rule is that the scheme “is only available to Australian Citizens and Permanent Residents”. Permanent residents who are not citizens have been eligible since July 2023, and about 50,000 of them have used it. In April 2026 the Opposition Leader, Angus Taylor, said he was “appalled” and that a Coalition government would restrict the scheme to citizens. The Immigration Minister, Tony Burke, replied that permanent residents’ eligibility is consistent with how comparable programs have long been run. Temporary visa holders are not eligible under the published rules. AAP FactCheck has rated as false a social-media claim that the scheme is a home-loan program for migrants: it is one scheme, with the same rules for every eligible buyer.',
      sources: [
        { title: 'First Home Buyers (Australian Government): scheme FAQs, eligibility', url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/5-percent-tools-and-resources/faqs' },
        { title: 'Housing Australia: over 300,000 Australians supported, 30 March 2026 (expansion to permanent residents, July 2023)', url: 'https://www.housingaustralia.gov.au/media/home-ownership-reality-over-300000-australians-supported-australian-government-5-deposit' },
        { title: 'ABC News: Coalition proposal to block non-citizens from the scheme, 16 April 2026', url: 'https://www.abc.net.au/news/2026-04-16/proposal-to-block-5pc-deposit-scheme-for-non-citizens-condemned/106564820' },
        { title: 'AAP FactCheck: migrant home loan scheme is a social media mirage, 5 May 2026', url: 'https://aapnews.aap.com.au/news/migrant-home-loan-scheme-is-a-social-media-mirage' },
      ] },
  ],
  response: 'The Housing Minister says Treasury expects the scheme to add about 0.5% to prices over six years, an effect she says “will be absolutely dwarfed” by interest rates and construction costs, and that it lets first home buyers stop paying rent years earlier and avoid tens of thousands of dollars in mortgage insurance. Her office says the scheme helps “hundreds of thousands of first home buyers while we fix a supply problem generations in the making”.',
  outcome: 'The scheme continues unchanged. Guarantees issued in its first four months were about 75% higher than in the four months before (22,921 against 13,105, ABC, February 2026). The Coalition has promised to limit it to citizens. No official review of its effect on prices has been published.',
  status: 'ongoing',
  sources: [
    { title: 'Australian Government: 5% Deposit Scheme', url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme' },
    { title: 'Scheme property price caps', url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps' },
    { title: 'Prime Minister: 5% deposits for all first home buyers, sooner, 25 August 2025', url: 'https://www.pm.gov.au/media/albanese-government-delivers-5-deposits-all-first-home-buyers-sooner' },
    { title: 'ABC News: influx of buyers under the 5% deposit scheme, 27 February 2026', url: 'https://www.abc.net.au/news/2026-02-27/five-pc-home-deposit-scheme-influx/106136868' },
  ],
  verified_on: '2026-09-18',
};
