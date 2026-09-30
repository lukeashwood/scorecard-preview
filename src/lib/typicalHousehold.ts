/* A typical household, then and now. Every assumption is an official figure, listed with its source, and the whole
   calculation runs at build time from the site's data, so it moves when the data does.

   Then = the June quarter 2022 (the government took office on 23 May 2022). Now = the latest quarter in the data.
   Household = a couple, both working, each on the median wage (ABS Employee Earnings). The ABS has published no
   median household income since 2019-20: the 2021-22 survey was cancelled and the 2023-24 results were withheld. */
import { byId } from './measures';
import { incomeTax, RULES_2223, type TaxRules } from './personalTax';

export const SRC = {
  earnings2022: 'https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/employee-earnings/aug-2022',
  hes: 'https://www.abs.gov.au/statistics/economy/finance/household-expenditure-survey-australia-summary-results/latest-release',
  lending: 'https://www.abs.gov.au/statistics/economy/finance/lending-indicators/latest-release',
  cpi: 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release',
  sih: 'https://www.abs.gov.au/statistics/detailed-methodology-information/information-papers/survey-income-and-housing-2023-24-review-report',
};

// ABS Employee Earnings, August 2022: median weekly earnings, all employees ($1,250).
const MEDIAN_WEEKLY_2022 = 1250;
// ABS Lending Indicators: average new owner-occupier loan, Australia, June quarter 2022 ($611,000; excludes refinancing).
const LOAN = 611000;
// ABS Household Expenditure Survey 2015-16 (latest), average weekly spending per household:
//   groceries = food and non-alcoholic beverages $237 less meals out and takeaway ($44 + $31) = $162
//   petrol $38 (all households); vehicle registration and insurance $36.80 (households in major cities, "high accessibility")
// CPI index numbers (8 capitals, Sept qtr 2025 = 100) used to bring 2015-16 amounts to the June quarter 2022:
//   food 74.93 -> 86.87; automotive fuel 66.29 -> 104.25; insurance 58.97 -> 72.86; other motor vehicle services 78.75 -> 87.86
const TO_2022 = { food: 86.87 / 74.93, fuel: 104.25 / 66.29, insurance: 72.86 / 58.97, motor: 87.86 / 78.75 };
// Other services in respect of motor vehicles (includes registration), June qtr 2022 -> June qtr 2026: +14.8%.
const MOTOR_SINCE_2022 = 14.8;

const repay = (loan: number, rate: number) => { const i = rate / 1200, n = 360; return (loan * i) / (1 - Math.pow(1 + i, -n)); };

export function typicalHousehold(now: TaxRules | null) {
  const pvw = byId('prices_vs_wages'); if (!pvw || !now) return null;
  const bar = (re: RegExp) => pvw.chart.bars?.find((b) => re.test(b.name))?.value;
  const cpi = bar(/^All prices/), wpi = bar(/^Wages/), food = bar(/^Food/), fuel = bar(/^Petrol/), ins = bar(/^Insurance/);
  if ([cpi, wpi, food, fuel, ins].some((v) => v == null)) return null;
  const g = (p: number) => 1 + p / 100;

  // Mortgage rates: RBA average variable rate on existing owner-occupier loans, May 2022 and the latest month, plus any
  // cash rate changes announced after that month (assumed passed on in full), so "now" reflects the latest decision.
  const mp = byId('mortgage')?.chart.series?.[0]?.points ?? [];
  const m0 = mp.find((p) => p[0].startsWith('2022-05')), m1 = mp[mp.length - 1];
  const steps = byId('interest_rates')?.chart.series?.[0]?.points ?? [];
  if (!m0 || !m1) return null;
  const atDate = (d: string) => { const b = steps.filter((p) => p[0] <= d); return b.length ? b[b.length - 1][1] : null; };
  const cashAtF6 = atDate(m1[0]), cashNow = steps.length ? steps[steps.length - 1][1] : null;
  const lift = cashAtF6 != null && cashNow != null ? cashNow - cashAtF6 : 0;
  const rate0 = m0[1], rate1 = m1[1] + lift;

  const week = (v: number) => v * 52;
  const pay0 = week(MEDIAN_WEEKLY_2022) * 2, pay1 = pay0 * g(wpi!);          // both partners, pay grown by the Wage Price Index
  const each0 = pay0 / 2, each1 = pay1 / 2;
  const tax0 = 2 * incomeTax(each0, RULES_2223), tax1 = 2 * incomeTax(each1, now);
  const take0 = pay0 - tax0, take1 = pay1 - tax1;

  const groc0 = week(162 * TO_2022.food), fuel0 = week(38 * TO_2022.fuel), car0 = week(36.8 * (TO_2022.insurance + TO_2022.motor) / 2);
  const groc1 = groc0 * g(food!), fuel1 = fuel0 * g(fuel!), car1 = week(36.8 * (TO_2022.insurance * g(ins!) + TO_2022.motor * g(MOTOR_SINCE_2022)) / 2);
  const mort0 = 12 * repay(LOAN, rate0), mort1 = 12 * repay(LOAN, rate1);

  const left0 = take0 - mort0 - groc0 - fuel0 - car0, left1 = take1 - mort1 - groc1 - fuel1 - car1;
  const left0Today = left0 * g(cpi!);
  return {
    period: pvw.headline.period ?? '', cpi: cpi!, wpi: wpi!, food: food!, fuel: fuel!, ins: ins!, motor: MOTOR_SINCE_2022,
    loan: LOAN, rate0, rate1, rateMonth: m1[0], lift, weekly0: MEDIAN_WEEKLY_2022, weekly1: (pay1 / 2) / 52, taxLabel: now.label,
    rows: [
      { l: 'Household income, before tax', a: pay0, b: pay1, n: `2 people on the median wage, grown by the Wage Price Index (+${wpi!.toFixed(1)}%)` },
      { l: 'Income tax and Medicare levy', a: -tax0, b: -tax1, n: `${RULES_2223.label} rates, then ${now.label} rates` },
      { l: 'Mortgage repayments', a: -mort0, b: -mort1, n: `$${(LOAN / 1000).toFixed(0)}k average loan, 30 years, ${rate0.toFixed(2)}% then, ${rate1.toFixed(2)}% now` },
      { l: 'Groceries', a: -groc0, b: -groc1, n: `Food prices +${food!.toFixed(1)}%` },
      { l: 'Petrol, including driving to work', a: -fuel0, b: -fuel1, n: `Fuel prices ${fuel! >= 0 ? '+' : ''}${fuel!.toFixed(1)}% (June quarters)` },
      { l: 'Car registration and insurance', a: -car0, b: -car1, n: `Insurance +${ins!.toFixed(1)}%, registration and other car services +${MOTOR_SINCE_2022}%` },
    ],
    left0, left1, left0Today, diff: left1 - left0Today,
  };
}
