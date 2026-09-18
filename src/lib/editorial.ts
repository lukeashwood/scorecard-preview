/* Rating rules v2.0. This file is the whole editorial layer: it decides what is a TARGET (someone in authority made a
   measurable commitment, so it gets a verdict), what is a CONDITION (a fact about the country, shown with its direction and
   no verdict), and how much the federal government actually controls each one. The methodology page is generated from it,
   so what readers are told is exactly what the code does. Change a rule here => bump SITE.rulesVersion and log it. */
import type { Editorial, RawMetric, Verdict } from './types';

const v = (verdict: Verdict, reason: string) => ({ verdict, reason });
const fromPipeline = (m: RawMetric, reasons: Record<string, string>) =>
  m.status === 'pass' ? v('on_track', reasons.pass) : m.status === 'warn' ? v('at_risk', reasons.warn) : v('off_track', reasons.fail);

const BP1 = 'https://budget.gov.au/content/bp1/download/bp1_2026-27.pdf';

export const EDITORIAL: Record<string, Editorial> = {
  /* ------------------------------------------------------------ targets: the government's own commitments */
  power_bills: {
    group: 'target', influence: 'shared', better: 'lower', labels: ['Nominal', 'Regulated default offers'],
    influenceNote: 'Canberra sets energy policy and rebates, but bills also depend on state decisions, network costs and world fuel prices.',
    target: {
      owner: 'government', ownerLabel: 'Election promise (2021)',
      commitment: 'Cut household power bills by $275 a year by 2025.', deadline: '2025-12-31',
      sourceLabel: 'RMIT ABC Fact Check: promise check on the $275 cut', sourceUrl: 'https://www.abc.net.au/news/2023-05-19/promise-check-cut-power-bills-by-275-dollars/101791146',
      rule: 'Not met if the regulated default power price in the benchmark regions is not $275 a year lower than when the promise was made, now that the 2025 deadline has passed.',
      rate: (m) => (m.headline.value <= -275 ? v('met', 'Default prices are at least $275 lower.') : v('not_met', 'The 2025 deadline has passed and default prices are higher, not $275 lower.')),
    },
  },
  housing_accord: { noSince: true,
    group: 'target', influence: 'shared', better: 'higher', labels: ['Original (not seasonally adjusted)'],
    influenceNote: 'A joint target with the states and territories, which control planning and most approvals. Canberra funds incentives and sets migration and tax settings.',
    target: {
      owner: 'government', ownerLabel: 'National Housing Accord',
      commitment: 'Build 1.2 million new well-located homes in the five years from 1 July 2024.', deadline: '2029-06-30',
      sourceLabel: 'Treasury, National Housing Accord', sourceUrl: 'https://treasury.gov.au/policy-topics/housing/accord',
      rule: 'On track if homes completed since July 2024 are at or above the 60,000-a-quarter pace needed; at risk if up to 10% behind; off track if more than 10% behind.',
      rate: (m) => (m.headline.value >= 100 ? v('on_track', 'Completions are at or above the pace needed.') : m.headline.value >= 90 ? v('at_risk', `Completions are running at ${m.headline.value}% of the pace needed.`) : v('off_track', `Completions are running at ${m.headline.value}% of the pace needed.`)),
    },
  },
  emissions_target: {
    group: 'target', influence: 'shared', better: 'higher', labels: ['Official inventory and projections'],
    influenceNote: 'The target is federal law. Delivery depends on federal and state policy, investment in the grid, and industry.',
    target: {
      owner: 'government', ownerLabel: 'Climate Change Act 2022',
      commitment: 'Cut greenhouse emissions to 43% below 2005 levels by 2030.', deadline: '2030-12-31',
      sourceLabel: 'Climate Change Act 2022', sourceUrl: 'https://www.legislation.gov.au/C2022A00037/latest/text',
      rule: 'Judged on the government’s own latest emissions projections: on track if they show the 2030 target being met, off track if they show it being missed.',
      rate: (m) => fromPipeline(m, { pass: 'The government’s own projections show the target being met.', warn: 'The government’s own projections show the target only narrowly met.', fail: 'The government’s own latest projections show the 2030 target being missed.' }),
    },
  },
  bulk_billing: {
    group: 'target', influence: 'direct', better: 'higher', labels: ['Medicare statistics'],
    influenceNote: 'Medicare rebates and bulk-billing incentives are set by the federal government. Individual GPs decide whether to bulk bill.',
    target: {
      owner: 'government', ownerLabel: 'Election commitment (2025)',
      commitment: '9 in 10 GP visits bulk billed by 2030.', deadline: '2030-12-31',
      sourceLabel: 'Prime Minister: delivering bulk billing for all Australians', sourceUrl: 'https://www.pm.gov.au/media/delivering-bulk-billing-all-australians',
      rule: 'Met at 90% or more. Before the 2030 deadline it is “in progress” while the rate is rising, and “at risk” if it is flat or falling.',
      rate: (m) => {
        if (m.headline.value >= 90) return v('met', 'The bulk-billing rate is at or above 90%.');
        const p = m.chart.series?.[0]?.points ?? []; const rising = p.length > 1 && p[p.length - 1][1] > p[p.length - 2][1];
        return rising ? v('in_progress', `At ${m.headline.value}% and rising; the deadline is 2030.`) : v('at_risk', `At ${m.headline.value}% and not rising; the deadline is 2030.`);
      },
    },
  },
  ndis: {
    group: 'target', influence: 'direct', better: 'lower', labels: ['Nominal'],
    influenceNote: 'The NDIS is a federal scheme co-funded with the states. The growth target was agreed by National Cabinet.',
    target: {
      owner: 'government', ownerLabel: 'National Cabinet (2023)',
      commitment: 'Slow annual growth in NDIS costs to no more than 8% by 1 July 2026.', deadline: '2026-07-01',
      sourceLabel: 'Office of Impact Analysis: NDIS reforms (states the National Cabinet target)', sourceUrl: 'https://oia.pmc.gov.au/sites/default/files/posts/2026/07/Impact%20Analysis%20(01.07.26%20Update)_0.pdf',
      rule: 'On track if the latest reported annual growth in scheme costs is 8% or less; off track if it is above 8%.',
      rate: (m) => (m.headline.value <= 8 ? v('on_track', `Latest annual growth is ${m.headline.value}%.`) : v('off_track', `Latest annual growth is ${m.headline.value}%, above the 8% target.`)),
    },
  },
  gross_debt: {
    group: 'target', influence: 'direct', better: 'lower', labels: ['Share of GDP'], useExtra: 0, chartTitle: 'Gross debt as a share of GDP', chartNote: 'Face value of Australian Government Securities on issue at 30 June, as a share of GDP. Lighter bars are 2026–27 Budget forecasts. The dollar figures are in the table and CSV.',
    influenceNote: 'Debt is the running total of federal budget deficits, so it follows directly from Budget decisions (and from downturns that cut revenue).',
    target: {
      owner: 'government', ownerLabel: 'Budget fiscal strategy',
      commitment: 'Reduce gross debt as a share of the economy over time.',
      sourceLabel: 'Budget Paper No. 1, 2026–27, Statement 3', sourceUrl: BP1,
      rule: 'Measured the government’s own way, as a share of GDP. On track if the latest actual is lower than at 30 June 2022 and the Budget forecasts it lower still in four years; at risk if only one of those holds; off track if neither.',
      rate: (m) => {
        const pts = m.chart.extra?.[0]?.points ?? []; const est = m.chart.estimateFrom ?? '9999';
        const at = (d: string) => pts.find((p) => p[0] === d)?.[1];
        const base = at('2022-06-30'); const actuals = pts.filter((p) => p[0] < est); const latest = actuals[actuals.length - 1]; const end = pts[pts.length - 1];
        if (base == null || !latest || !end) return v('in_progress', 'Not enough published data to judge.');
        const a = latest[1] < base, b = end[1] < latest[1];
        const txt = `${latest[1]}% of GDP at the latest actual, against ${base}% in June 2022; the Budget forecasts ${end[1]}% by ${end[0].slice(0, 4)}.`;
        return a && b ? v('on_track', txt) : a || b ? v('at_risk', txt) : v('off_track', txt);
      },
    },
  },
  /* ------------------------------------------------------------ an official target set by others */
  inflation: { baselineNote: 'Inflation was already 6.2% and climbing when the government took office. It peaked at 7.8% at the end of 2022.',
    group: 'target', influence: 'indirect', better: 'lower', labels: ['Original', 'Annual % change'], seriesIndex: 1,
    influenceNote: 'The independent Reserve Bank sets interest rates to control inflation. Federal spending and policy add to or ease the pressure at the margin.',
    target: {
      owner: 'official', ownerLabel: 'Reserve Bank target',
      commitment: 'Keep consumer price inflation between 2% and 3%.',
      sourceLabel: 'Statement on the Conduct of Monetary Policy (Treasurer and RBA)', sourceUrl: 'https://www.rba.gov.au/monetary-policy/framework/stmt-conduct-mp-8-2023-12-08.html',
      verdictLabels: { on_track: 'Within target', off_track: 'Outside target' },
      rule: 'Within target if the latest annual inflation rate is between 2% and 3%. This is the Reserve Bank’s job, so it is shown but does not count in the government’s tally.',
      rate: (m) => (m.headline.value >= 2 && m.headline.value <= 3 ? v('on_track', `Annual inflation is ${m.headline.value}%, inside the 2–3% band.`) : v('off_track', `Annual inflation is ${m.headline.value}%, outside the 2–3% band.`)),
    },
  },

  /* ------------------------------------------------------------ conditions: direction only, no verdict */
  real_wages: { baselineNote: 'Real wages were already falling when the government took office, because prices were rising faster than pay.', group: 'condition', influence: 'indirect', better: 'higher', dropContext: [/pre-election peak/i], labels: ['Original', 'Real (after inflation)'], influenceNote: 'Pay is set by employers, workers and the Fair Work Commission; inflation is managed by the Reserve Bank. Federal workplace laws and public-sector pay have some effect.' },
  prices_vs_wages: { group: 'context', influence: 'indirect', better: 'none', chartNote: 'Change in each price index, June quarter 2022 to June quarter 2026. The black line marks wage growth over the same period: bars that pass it rose faster than wages.', labels: ['Original'], influenceNote: 'Most prices are set in markets. Governments affect some directly (child care, medicines, energy rebates).' },
  electricity: { baselineNote: 'Wholesale power prices were spiking when the government took office, during the 2022 energy crisis.', group: 'condition', influence: 'shared', better: 'lower', labels: ['Original', 'Price index incl. rebates'], supports: 'power_bills', influenceNote: 'Shared with the states and the market. Government rebates lower the measured price while they last.' },
  wholesale_gas: { baselineNote: 'The starting point was a record high, set during the 2022 energy crisis.', group: 'condition', influence: 'shared', better: 'lower', labels: ['Nominal'], influenceNote: 'Set mainly by world energy markets. The federal price cap and gas code introduced in December 2022 also apply.' },
  mortgage: { baselineNote: 'Mortgage rates in May 2022 reflected the Reserve Bank’s pandemic emergency setting, which it had just begun to unwind.', group: 'condition', influence: 'indirect', better: 'lower', labels: ['Nominal'], supports: 'interest_rates', influenceNote: 'Follows the Reserve Bank’s cash rate, which the government does not set.' },
  interest_rates: { baselineNote: 'The cash rate was at a pandemic emergency low of 0.35% in May 2022. The Reserve Bank had begun lifting it earlier that month.', group: 'condition', influence: 'indirect', better: 'none', dropContext: [/adds to demand/i], betterNote: 'A higher or lower cash rate is a tool, not a goal, so its direction isn’t coloured.', labels: ['Policy rate'], influenceNote: 'Set by the independent Reserve Bank board, not by the government.' },
  home_prices: { group: 'condition', influence: 'shared', better: 'none', betterNote: 'Rising prices help owners and hurt buyers, so the direction isn’t coloured.', labels: ['Nominal', 'Mean price, not a like-for-like index'], unitOverride: "$'000", influenceNote: 'Driven by interest rates, supply (mostly state planning), migration and federal tax settings together.' },
  unemployment: { baselineNote: 'The starting point, 3.9%, was close to a 50-year low.', group: 'condition', influence: 'indirect', better: 'lower', dropContext: [/concentrated in publicly funded/i], labels: ['Seasonally adjusted'], influenceNote: 'Follows the business cycle and Reserve Bank policy more than any single federal decision.' },
  public_private_jobs: { group: 'condition', influence: 'shared', better: 'none', betterNote: 'The right balance of public and private jobs is a political judgement, so the direction isn’t coloured.', labels: ['Seasonally adjusted'], influenceNote: 'Public-sector jobs include state services such as hospitals and schools, as well as federal agencies.' },
  jobs_by_sector: { group: 'context', influence: 'shared', better: 'none', labels: ['Seasonally adjusted'], influenceNote: 'Health, education and care jobs are funded by federal and state governments together.' },
  productivity: { baselineNote: 'Measured productivity was temporarily lifted during the pandemic, so the mid-2022 starting point was unusually high.', group: 'condition', influence: 'indirect', better: 'higher', labels: ['Seasonally adjusted', 'Real'], influenceNote: 'Depends on business investment, technology and skills over many years. Policy matters, slowly.' },
  insolvencies: { baselineNote: 'Insolvencies in 2021–22 were unusually low because of pandemic support and a pause in tax-debt collection.', group: 'condition', influence: 'indirect', better: 'lower', labels: ['Financial-year totals'], unitOverride: 'companies', influenceNote: 'Follows interest rates, costs and demand. The ATO’s debt-collection stance, a federal lever, also matters.' },
  consumer_confidence: { group: 'condition', influence: 'indirect', better: 'higher', labels: ['Survey index'], influenceNote: 'A survey of how households feel, which reflects prices, rates and jobs rather than any one decision.' },
  gdp_per_capita: { group: 'condition', influence: 'indirect', better: 'higher', labels: ['Seasonally adjusted', 'Real'], influenceNote: 'The broad result of the economy and population growth together. Migration settings, a federal lever, affect the “per person” part.' },
  household_income: { group: 'condition', influence: 'shared', better: 'higher', labels: ['Seasonally adjusted', 'Real, per person'], influenceNote: 'Wages, mortgage interest, prices and income tax all feed in. Income tax is the federal lever.' },
  government_size: { group: 'condition', influence: 'shared', better: 'none', betterNote: 'How big government should be is a question of political values, so the direction isn’t coloured.', labels: ['Seasonally adjusted', 'All levels of government'], influenceNote: 'Counts federal, state and local government spending together.' },
  budget_balance: { baselineNote: '2021–22 was the last Budget year of the previous government.', group: 'condition', influence: 'direct', better: 'higher', chartNote: 'Bars below the line are deficits; bars above it are surpluses. Lighter bars are Budget forecasts. 2021–22 was the last Budget year of the previous government.', labels: ['Nominal $', 'Underlying cash balance'], influenceNote: 'The direct result of Budget decisions, plus swings in revenue from commodity prices and jobs.' },
  interest_costs: { baselineNote: '2021–22 was the last Budget year of the previous government. Interest rates on government debt have risen worldwide since.', group: 'condition', influence: 'direct', better: 'lower', labels: ['Nominal $', 'Cash payments'], influenceNote: 'Depends on how much debt there is (Budget decisions) and the interest rate on it (world markets).' },
  spending_gdp: { group: 'condition', influence: 'direct', better: 'none', betterNote: 'How much government should spend is a question of political values, so the direction isn’t coloured.', labels: ['Share of GDP'], influenceNote: 'Set directly by the Budget.' },
  aps_headcount: { group: 'condition', influence: 'direct', better: 'none', betterNote: 'The right size of the public service is a political judgement, so the direction isn’t coloured.', labels: ['Headcount at 30 June'], influenceNote: 'Set directly by the government. Part of the recent rise replaced contractors and labour hire.' },
  migration: { baselineNote: 'Borders had reopened only months earlier, so migration in mid-2022 was still rebounding from near zero.', group: 'condition', influence: 'direct', better: 'none', betterNote: 'The right level of migration is a political judgement, so the direction isn’t coloured.', labels: ['Original', 'Rolling 12 months'], influenceNote: 'Visa settings and caps are federal. Departures, New Zealanders and returning Australians are not capped.' },
  defence_spending: { group: 'condition', influence: 'direct', better: 'none', betterNote: 'How much to spend on defence is a political judgement, so the direction isn’t coloured.', labels: ['Share of GDP', 'Budget-time estimates'], influenceNote: 'Set directly by the Budget.' },
  legislation: { group: 'context', influence: 'direct', better: 'none', labels: ['Count of Acts'], influenceNote: 'Parliament passes laws; the government controls most of the agenda in the House.' },
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  met: 'Met', on_track: 'On track', in_progress: 'In progress', at_risk: 'At risk', off_track: 'Off track', not_met: 'Not met',
};
export const VERDICT_TONE: Record<Verdict, 'good' | 'warn' | 'bad' | 'neutral'> = {
  met: 'good', on_track: 'good', in_progress: 'neutral', at_risk: 'warn', off_track: 'bad', not_met: 'bad',
};
export const VERDICT_MEANING: Record<Verdict, string> = {
  met: 'The commitment has been delivered.',
  on_track: 'The latest official figures are consistent with the commitment being delivered.',
  in_progress: 'The deadline is still ahead and the figures are moving the right way; it’s too early for a verdict.',
  at_risk: 'The figures are behind where they need to be, but the commitment could still be delivered.',
  off_track: 'On the latest official figures, the commitment will not be delivered without a clear change.',
  not_met: 'The deadline has passed and the commitment was not delivered.',
};
export const INFLUENCE_LABEL = { direct: 'Direct federal control', shared: 'Shared control', indirect: 'Indirect influence' } as const;
export const INFLUENCE_MEANING = {
  direct: 'The federal government decides this itself, mainly through the Budget or legislation.',
  shared: 'The federal government is one of several hands on the wheel, alongside the states, regulators or markets.',
  indirect: 'Decided mostly by others (the Reserve Bank, world markets, businesses and households). Federal policy nudges it.',
} as const;
