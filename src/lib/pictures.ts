/* Figures for the picture charts, worked out from data the site already holds. Each function returns null when its
   data is missing, so a picture simply doesn't appear rather than showing a wrong number. Nothing here is typed in by
   hand except the 2022 median wage, which typicalHousehold.ts also uses and documents. */
import { byId, DELIVERIES, TODAY } from './measures';

const bar = (id: string, re: RegExp) => byId(id)?.chart.bars?.find((b) => re.test(b.name))?.value;
const series = (id: string, n = 0) => byId(id)?.chart.series?.[n]?.points ?? [];

/** Power bills: the promised $275 cut beside what default prices actually did, by region. */
export function powerBills() {
  const m = byId('power_bills'); if (!m?.chart.bars) return null;
  const promise = m.chart.bars.find((b) => /promise/i.test(b.name))?.value;
  const regions = m.chart.bars.filter((b) => !/promise/i.test(b.name)).map((b) => ({ name: b.name.replace(/\s*\(.*\)/, ''), full: b.name, value: b.value }));
  const nsw = regions.find((r) => /NSW/.test(r.full));
  if (promise == null || !nsw) return null;
  return { promise, nsw: nsw.value, regions, period: m.headline.period ?? '' };
}

/** Real wages: what $100 of private-sector pay in June 2022 buys today. */
export function wageNote() {
  const pts = series('real_wages', 0); const last = pts[pts.length - 1];
  if (!last) return null;
  return { value: last[1], date: last[0], lost: 100 - last[1] };
}

// ABS Employee Earnings, August 2022: median weekly earnings, all employees. Grown by the Wage Price Index.
const MEDIAN_WEEKLY_2022 = 1250;
/** Mortgage: the extra monthly repayment on a $600,000 loan, counted in days of median pay before tax. */
export function mortgageDays() {
  const m = byId('mortgage'); const wpi = bar('prices_vs_wages', /^Wages/);
  if (!m || wpi == null) return null;
  const extra = m.headline.value;
  const weekly = MEDIAN_WEEKLY_2022 * (1 + wpi / 100);
  const daily = weekly / 5;
  return { extra, weekly, daily, days: extra / daily, workdays: 21.7, period: m.headline.period ?? '' };
}

/** NDIS: scheme expenses at the start and end of the series, in billions. */
export function ndisCoins() {
  const pts = series('ndis', 0).filter((p) => p[0] <= TODAY);
  if (pts.length < 2) return null;
  return { from: pts[0], to: pts[pts.length - 1], growth: ((pts[pts.length - 1][1] / pts[0][1]) - 1) * 100 };
}

/** People in work: May 2022 against the latest month. */
export function workCrowd() {
  const se = byId('employment')?.sinceElection; if (!se) return null;
  return { from: se.from, to: se.to, added: se.to[1] - se.from[1], pct: se.change };
}

/** Renewables: the latest share stated in the commitment's own result text, against the 82% target. */
export function renewablesShare() {
  const d = DELIVERIES.find((x) => x.id === 'renewables-82'); if (!d) return null;
  const hit = d.reason.match(/(\d+(?:\.\d+)?)%/); const year = d.reason.match(/in (20\d\d)/);
  if (!hit) return null;
  return { share: +hit[1], target: 82, year: year?.[1] ?? '', verdict: d.verdict };
}

/** Budget: actual results from 2021-22, plus the current year's Budget estimate, marked as such. */
export function budgetWaterline() {
  const m = byId('budget_balance'); if (!m) return null;
  const est = m.chart.estimateFrom ?? '9999';
  const all = series('budget_balance', 0).filter((p) => p[0] >= '2022-06-30');
  const actual = all.filter((p) => p[0] < est);
  const next = all.find((p) => p[0] >= est);
  if (actual.length < 2) return null;
  return { years: [...actual.map((p) => ({ p, estimate: false })), ...(next ? [{ p: next, estimate: true }] : [])] };
}

/** "2024-25" style label for a financial year ending on the given date. */
export const fy = (d: string) => { const y = +d.slice(0, 4); return `${y - 1}-${String(y).slice(2)}`; };
