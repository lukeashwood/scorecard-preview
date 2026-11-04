/* The 3 November 2026 rate rise and what the government, the Reserve Bank and the Opposition each said about it.
   Quotes were checked against the pages they are attributed to on 4 November 2026. Figures that come from the site's
   own data are read at build time, so they move when the data does. */
import raw from '../data/metrics.json';
import type { Controversy } from './controversies';

const metrics = (raw as any).metrics as any[];
const byId = (id: string) => metrics.find((m) => m.id === id);
const lastOf = (id: string, i = 0) => { const s = byId(id)?.chart?.series?.[i]?.points as [string, number][] | undefined; return s ? s[s.length - 1] : null; };
const cash = lastOf('interest_rates');
const infl = byId('inflation')?.headline;
const pct = (v?: number, d = 1) => (v == null ? 'n/a' : `${v.toFixed(d)}%`);

export const RATE_RISE_NOV: Controversy = {
  id: 'rate-rise-november-2026-government-messages', featured: true, date: '2026-11-03', type: 'policy', category: 'Budget and inflation',
  title: 'Rate rise to 4.85%: what the government and the Reserve Bank each point to',
  minister: 'Jim Chalmers and Anthony Albanese', portfolio: 'Treasurer; Prime Minister',
  summary: 'The Reserve Bank lifted the cash rate from 4.60% to 4.85% on 3 November 2026, its 5th rise this year, on a 6 to 3 vote. Treasurer Jim Chalmers said Australians are paying a “hefty price” for the Middle East war. Prime Minister Anthony Albanese said he does not accept that government policy caused the rise and pointed to international pressures and oil prices. Governor Michele Bullock said the tightening is to address domestic capacity pressures, and that on oil prices it was “both”. The Opposition says the problem is homegrown. Opposition figures and some commentators say the explanations do not line up with the Reserve Bank’s, and that the government is talking about household pain while preparing savings for the December budget update. The government says the positions fit together.',
  figures: [
    // The 3 November decision is entered by hand as a floor: the RBA's data table can lag its announcement by days.
    { label: 'Cash rate', value: pct(Math.max(cash?.[1] ?? 0, 4.85), 2), note: 'RBA cash rate target after the 3 November 2026 decision' },
    { label: 'Board vote', value: '6 to 3', note: 'Members voting to raise the rate, and to hold it' },
    { label: 'Inflation', value: pct(infl?.value), note: `Annual CPI, ${infl?.period ?? 'latest month'}. RBA target is 2 to 3%.` },
    { label: 'RBA forecast', value: '4.5%', note: 'Headline inflation the Reserve Bank expects for December 2026' },
  ],
  points: [
    { heading: 'What the Reserve Bank decided and the reasons it gave', standing: 'established',
      body: 'On 3 November the Monetary Policy Board raised the cash rate target by 0.25 percentage points, from 4.60% to 4.85%. 6 members voted to raise it and 3 to hold. The Board’s statement gave persistent inflation, higher inflation forecasts, firms passing on higher costs and rising inflation expectations as its reasons. It said higher fuel and commodity prices from the Middle East conflict are part of why forecasts were revised up, and that capacity pressures in the domestic economy look tighter than it thought. Its November forecasts have headline inflation at 4.5% in December 2026, above 3% until the end of 2027.',
      sources: [
        { title: 'Statement by the Monetary Policy Board: Monetary Policy Decision (RBA, 3 November 2026)', url: 'https://www.rba.gov.au/media-releases/2026/mr-26-30.html' },
        { title: 'Statement on Monetary Policy, November 2026: Overview (RBA)', url: 'https://www.rba.gov.au/publications/smp/2026/nov/overview.html' },
      ] },
    { heading: 'What the Treasurer and the Prime Minister said', standing: 'position',
      body: 'Jim Chalmers said on 3 November that Australians are paying a “hefty price” for the Middle East war, that the decision was expected but hard on households, that government spending is not driving inflation, and that more savings will come in the mid-year update. On ABC Radio he said the budget needs to be “as tight as it can be”. On 4 November Anthony Albanese, speaking from the Commonwealth leaders’ meeting in Antigua and Barbuda, said he does not accept that government policy caused the rise. He pointed to international pressures and oil prices, said savings are needed before the end of the year and will be set out in the December update, and said the government will not cut health or schools. Amanda Rishworth said the budget is not the main driver of the rise, but the government will still pursue “responsible savings and targeted cost of living relief”.',
      sources: [
        { title: 'RBA hikes cash rate to 18-year high of 4.85 per cent, as it happened (ABC, 3 November 2026)', url: 'https://www.abc.net.au/news/2026-11-03/rba-interest-rates-markets-live-coverage/107338216' },
        { title: 'Federal politics live blog (ABC, 4 November 2026)', url: 'https://www.abc.net.au/news/2026-11-04/federal-politics-live-blog-angus-taylor-rates/107342840' },
        { title: 'RBA interest rate decision live (Yahoo Finance Australia, 3 November 2026)', url: 'https://au.finance.yahoo.com/news/live/rba-interest-rate-decision-live-millions-brace-as-brutal-ripple-effect-to-sweep-australia-020519560.html' },
      ] },
    { heading: 'What the Reserve Bank Governor said', standing: 'position',
      body: 'At the 3 November media conference Michele Bullock said the tightening is “to address domestic capacity pressures”. Asked whether high oil prices are the main cause of inflation, she said “it’s both”. Asked whether high government spending complicates the bank’s task, she said “we take public demand as given” and that “independence is a two-way street”. She said business investment has been much stronger than the bank expected. Asked about the risk of recession, she said people feel poorer. These are the bank’s own explanations of its decision. Where the site shows results it uses the bank’s published figures, not its commentary.',
      sources: [
        { title: 'Media Conference: Monetary Policy Decision (RBA, 3 November 2026)', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-11-03.html' },
      ] },
    { heading: 'What the Opposition said', standing: 'position',
      body: 'Angus Taylor called the inflation problem “homegrown” and said Labor has lost control of spending. On 4 November he said government spending is growing faster than the economy and needs to be cut. Asked whether the Coalition has credibility on cuts while opposing the private health insurance rebate changes for over 65s, he said aggregate spending is what matters. Shadow Treasurer Tim Wilson said the government is “addicted to spending”. James Paterson told the Today show that the Prime Minister was “out of touch” to be overseas during the decision. Albanese says the Coalition rejected savings the government put forward and cannot oppose the health insurance changes while asking for changes to fuel tax.',
      sources: [
        { title: 'RBA hikes cash rate to 18-year high of 4.85 per cent, as it happened (ABC, 3 November 2026)', url: 'https://www.abc.net.au/news/2026-11-03/rba-interest-rates-markets-live-coverage/107338216' },
        { title: 'Federal politics live blog (ABC, 4 November 2026)', url: 'https://www.abc.net.au/news/2026-11-04/federal-politics-live-blog-angus-taylor-rates/107342840' },
        { title: 'RBA interest rate decision live (Yahoo Finance Australia, 3 November 2026)', url: 'https://au.finance.yahoo.com/news/live/rba-interest-rate-decision-live-millions-brace-as-brutal-ripple-effect-to-sweep-australia-020519560.html' },
      ] },
    { heading: 'Do the government’s explanations fit together?', standing: 'contested',
      body: 'Critics and some commentators point to 3 gaps. First, the government puts the war and oil prices first, while the Governor says the tightening is for domestic capacity pressures and that oil and domestic factors are “both” at work; the bank’s own statement lists the Middle East conflict as one cause among several. Second, the Treasurer says spending is not driving inflation, yet the government says savings are needed, and Chalmers now says the budget must be “as tight as it can be”, having defended the spending record in late September. Third, an ANU commentator wrote that the Treasurer acknowledges household stress while fiscal policy is expected to tighten just as that stress peaks. The government’s answer is that the war made inflation worse, spending is a smaller part of the story, and savings are sensible either way. Rishworth’s line that the budget is not the main driver but savings will still be pursued is that answer in one sentence. Whether that is consistent or contradictory is the question this entry puts to the reader.',
      sources: [
        { title: 'Federal politics live blog (ABC, 4 November 2026)', url: 'https://www.abc.net.au/news/2026-11-04/federal-politics-live-blog-angus-taylor-rates/107342840' },
        { title: 'Media Conference: Monetary Policy Decision (RBA, 3 November 2026)', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-11-03.html' },
        { title: 'Opinion: RBA’s interest rates rise to lift household stress, and political pain for Jim Chalmers and Anthony Albanese (ANU)', url: 'https://ausi.anu.edu.au/news/opinion-rbas-interest-rates-rise-lift-household-stress-and-political-pain-jim-chalmers-and' },
        { title: 'Treasurer Jim Chalmers defends inflation record as 15-year interest rate high looms (ABC, 28 September 2026)', url: 'https://www.abc.net.au/news/2026-09-28/chalmers-interest-rates-cost-of-living-households-mortgage/107203392' },
      ] },
    { heading: 'Pressure on the Treasurer', standing: 'established',
      body: 'Yahoo News Australia reported on 3 November that Chalmers has the lowest net approval rating in the Albanese cabinet, at minus 16 in a Newspoll, and that Rishworth backed him on the Today show. Chalmers declined to step aside and said the poor polling was to be expected given the difficult tax and housing reforms he is pursuing.',
      sources: [
        { title: 'Cabinet colleagues continue to back embattled Treasurer (Yahoo News Australia, 3 November 2026)', url: 'https://au.news.yahoo.com/not-broncos-waterboy-fiery-chalmers-215357064.html' },
      ] },
  ],
  response: 'The Treasurer says the war in the Middle East is why households are paying more and that government spending is not driving inflation; he says more savings will come in the mid-year update. The Prime Minister says government policy did not cause the rise, points to international pressures and oil prices, and says savings are needed before the end of the year. The government says these positions fit together.',
  outcome: 'Ongoing. The mid-year budget update is due in December. The Governor said the outlook is uncertain and that the next move is not settled.',
  status: 'ongoing',
  sources: [
    { title: 'Statement by the Monetary Policy Board: Monetary Policy Decision (RBA, 3 November 2026)', url: 'https://www.rba.gov.au/media-releases/2026/mr-26-30.html' },
    { title: 'Media Conference: Monetary Policy Decision (RBA, 3 November 2026)', url: 'https://www.rba.gov.au/speeches/2026/mc-gov-2026-11-03.html' },
    { title: 'RBA hikes cash rate to 18-year high of 4.85 per cent, as it happened (ABC, 3 November 2026)', url: 'https://www.abc.net.au/news/2026-11-03/rba-interest-rates-markets-live-coverage/107338216' },
    { title: 'Federal politics live blog (ABC, 4 November 2026)', url: 'https://www.abc.net.au/news/2026-11-04/federal-politics-live-blog-angus-taylor-rates/107342840' },
  ],
  verified_on: '2026-11-04',
};
