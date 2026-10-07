/* Search titles and descriptions. Page headings stay short and plain; these are what Google shows in results.
   Titles lead with the words people actually search (checked against Google Trends, Australia, Oct 2026) and stay
   under about 60 characters including " | Gov Score". */

export const MEASURE_SEO: Record<string, string> = {
  inflation: 'Inflation rate Australia: latest CPI and trend',
  unemployment: 'Unemployment rate Australia: latest and trend',
  interest_rates: 'RBA cash rate: every rate rise and cut since 2022',
  mortgage: 'Mortgage repayments since 2022: what rates added',
  electricity: 'Electricity prices in Australia since 2022',
  power_bills: 'The $275 power bill promise: was it kept?',
  wholesale_gas: 'Wholesale gas prices in Australia (east coast)',
  home_prices: 'Australian house prices: average price and trend',
  housing_accord: 'Housing Accord 1.2 million homes: on track?',
  migration: 'Net overseas migration Australia: latest figures',
  real_wages: 'Real wages Australia: public vs private sector',
  prices_vs_wages: 'Cost of living vs wages since the 2022 election',
  productivity: 'Productivity in Australia: latest figures',
  insolvencies: 'Business collapses in Australia: insolvencies',
  consumer_confidence: 'Consumer sentiment Australia: latest index',
  gdp_per_capita: 'GDP per capita Australia vs total GDP growth',
  household_income: 'Real household income per person, Australia',
  bulk_billing: 'GP bulk billing rate Australia: latest figures',
  government_size: 'Size of government in the Australian economy',
  gross_debt: 'Australian government debt: latest and trend',
  budget_balance: 'Australian budget deficit: latest and forecast',
  interest_costs: 'Interest on Australian government debt',
  spending_gdp: 'Government spending as a share of GDP, Australia',
  aps_headcount: 'Size of the Australian Public Service (APS)',
  ndis: 'NDIS cost growth: is the 8% target being met?',
  emissions_target: "Australia's 43% emissions target: on track?",
  public_private_jobs: 'Public vs private sector jobs growth, Australia',
  jobs_by_sector: "Where Australia's new jobs are coming from",
  defence_spending: 'Australian defence spending as a share of GDP',
  legislation: 'Laws passed by the Albanese Government',
  income_tax_shares: 'Who pays income tax in Australia? Top 1% and 10%',
  personal_transfers: 'Money sent overseas from Australia each year',
  consultancy_contracts: 'Federal government spending on consultants',
  household_payments: 'Mortgage interest and income tax: share of household income',
  people_per_home: 'Population growth vs new homes built, Australia',
  rents_vs_wages: 'Rents vs wages in Australia since 2022',
  fuel_prices: 'Petrol prices in Australia: fuel price changes',
  price_to_earnings: 'House price to income ratio, Australia',
  tax_take: 'Tax to GDP ratio: Commonwealth tax take, Australia',
  living_standards_decades: 'Australian living standards by decade',
};

/** Keep a description inside the length Google shows (about 155 characters), cutting at a word. */
export function clip(s: string, max = 155): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}
