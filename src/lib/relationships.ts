/* Relationship charts: two official series side by side, to see whether they move together.
   Built at compile time from the site's own data, so every pair updates when the data does. */
import { MEASURES, ALL_METRICS } from './measures';
import type { Point, RawMetric } from './types';

type Freq = 'q' | 'fy';
interface Side { measure: string; series?: number; label: string; unit: string; decimals: number; transform?: 'level' | 'yoy' | 'fyJune' }
export interface PairSpec {
  id: string; title: string; question: string; freq: Freq; x: Side; y: Side; lags: number[];
  /** What the pair can and cannot show. Written plainly; no pair on this page proves cause and effect. */
  read: string;
}

export const PAIRS: PairSpec[] = [
  { id: 'spending-inflation', title: 'Commonwealth spending and inflation', freq: 'fy', lags: [0, 1, 2],
    question: 'Do years of higher federal spending line up with higher inflation?',
    x: { measure: 'spending_gdp', label: 'Commonwealth spending, % of GDP', unit: '%', decimals: 1 },
    y: { measure: 'inflation', label: 'Inflation (year to June)', unit: '%', decimals: 1, transform: 'fyJune' },
    read: 'Spending adds to demand, and the Reserve Bank says demand beyond what the economy can supply pushes up prices. But spending also jumps in downturns, when inflation is usually low (2009 and 2020), which weakens any simple link. The lag setting asks whether inflation follows spending a year or two later.' },
  { id: 'public-demand-inflation', title: 'Public demand (all governments) and inflation', freq: 'q', lags: [0, 4, 8],
    question: 'When governments take a bigger share of the economy, does inflation follow?',
    x: { measure: 'government_size', label: 'Public demand, % of the economy', unit: '%', decimals: 1 },
    y: { measure: 'inflation', label: 'Inflation, annual', unit: '%', decimals: 1 },
    read: 'Public demand is spending and investment by federal, state and local governments together. It is the measure the Reserve Bank looks at when it talks about government demand. Other things move inflation too: world energy prices, interest rates, wages and the exchange rate.' },
  { id: 'cashrate-inflation', title: 'Interest rates and inflation', freq: 'q', lags: [0, 4, 8],
    question: 'How does the Reserve Bank’s cash rate move with inflation?',
    x: { measure: 'interest_rates', label: 'RBA cash rate', unit: '%', decimals: 2 },
    y: { measure: 'inflation', label: 'Inflation, annual', unit: '%', decimals: 1 },
    read: 'The Reserve Bank raises rates when inflation is too high and cuts when it is low, so the two tend to rise together at first. Higher rates are meant to bring inflation down over the following one to two years, which is what the lag setting lets you look for.' },
  { id: 'migration-homeprices', title: 'Migration and home prices', freq: 'q', lags: [0, 4],
    question: 'Do home prices rise faster when more people are arriving?',
    x: { measure: 'migration', label: 'Net overseas migration, past 12 months', unit: 'people', decimals: 0 },
    y: { measure: 'home_prices', label: 'Home prices, annual change', unit: '%', decimals: 1, transform: 'yoy' },
    read: 'More people need more homes, so faster population growth adds to housing demand. Interest rates, credit, tax settings and how many homes get built matter at least as much. The ABS home price series only starts in 2011, so this pair covers fewer years.' },
  { id: 'migration-gdppc', title: 'Migration and growth per person', freq: 'q', lags: [0, 4],
    question: 'Does faster migration go with more or less growth for each person?',
    x: { measure: 'migration', label: 'Net overseas migration, past 12 months', unit: 'people', decimals: 0 },
    y: { measure: 'gdp_per_capita', label: 'Real GDP per person, annual change', unit: '%', decimals: 1, transform: 'yoy' },
    read: 'Migration adds workers and customers, which lifts total GDP. Whether it lifts GDP for each person depends on the skills migrants bring and whether housing and infrastructure keep up. COVID border closures in 2020 and 2021 dominate any short sample.' },
  { id: 'unemployment-confidence', title: 'Unemployment and consumer confidence', freq: 'q', lags: [0, 4],
    question: 'Do people feel worse when unemployment rises?',
    x: { measure: 'unemployment', label: 'Unemployment rate', unit: '%', decimals: 1 },
    y: { measure: 'consumer_confidence', label: 'Consumer sentiment (100 = neutral)', unit: 'index', decimals: 1 },
    read: 'Job security is one of the biggest influences on how households feel, along with interest rates and prices. Since 2022 confidence has been low even with low unemployment, which points to prices and rates.' },
  { id: 'mortgage-confidence', title: 'Mortgage rates and consumer confidence', freq: 'q', lags: [0],
    question: 'Do households feel worse when mortgage rates rise?',
    x: { measure: 'mortgage', series: 0, label: 'Average variable mortgage rate', unit: '%', decimals: 2 },
    y: { measure: 'consumer_confidence', label: 'Consumer sentiment (100 = neutral)', unit: 'index', decimals: 1 },
    read: 'Around a third of households have a mortgage, and rate rises cut straight into their budgets. The RBA’s mortgage rate series used here only starts in 2019.' },
  { id: 'debt-interest', title: 'Government debt and interest costs', freq: 'fy', lags: [0],
    question: 'How much does each extra dollar of debt cost in interest?',
    x: { measure: 'gross_debt', label: 'Gross debt, $ billion', unit: '$bn', decimals: 0 },
    y: { measure: 'interest_costs', label: 'Interest payments, $ billion', unit: '$bn', decimals: 1 },
    read: 'Interest costs depend on how much is borrowed and on the interest rate when each bond was issued. Cheap debt from 2020 and 2021 is being refinanced at higher rates, so interest costs can keep rising faster than debt for years.' },
  { id: 'govsize-productivity', title: 'Size of government and productivity growth', freq: 'q', lags: [0, 4, 8],
    question: 'Does productivity grow more slowly when government takes a bigger share of the economy?',
    x: { measure: 'government_size', label: 'Public demand, % of the economy', unit: '%', decimals: 1 },
    y: { measure: 'productivity', label: 'Labour productivity, annual change', unit: '%', decimals: 1, transform: 'yoy' },
    read: 'Economists argue about this. Much of what governments produce, such as health care and education, is hard to measure, and measured productivity in those sectors grows slowly. That can drag on the national figure without anyone working less hard. Productivity also swings with the business cycle.' },
  { id: 'migration-transfers', title: 'Migration and money sent overseas', freq: 'fy', lags: [0, 1],
    question: 'Does more money go overseas in years when more people arrive?',
    x: { measure: 'migration', label: 'Net overseas migration, financial year', unit: 'people', decimals: 0, transform: 'fyJune' },
    y: { measure: 'personal_transfers', label: 'Personal transfers sent overseas, $ billion', unit: '$bn', decimals: 1 },
    read: 'Both have grown over 20 years along with the population and incomes, so they will tend to rise together whatever the link between them. In 2020-21, when borders were closed and net migration was below zero, personal transfers barely changed. The ABS does not publish who sends the money or where it goes.' },
];

/* ------------------------------------------------------------------ series handling */
const metric = (id: string): RawMetric | undefined => ALL_METRICS.find((m) => m.id === id);
const qEnd = (d: string) => { const y = +d.slice(0, 4), m = +d.slice(5, 7); const qm = Math.ceil(m / 3) * 3; return `${y}-${String(qm).padStart(2, '0')}-${[31, 30, 30, 31][qm / 3 - 1]}`; };

function raw(side: Side): Point[] {
  const m = metric(side.measure); if (!m) return [];
  const s = m.chart.series?.[side.series ?? 0]; if (!s) return [];
  const est = m.chart.estimateFrom;
  return s.points.filter((p) => !est || p[0] < est);
}

/** Put a series on quarter-end dates: monthly figures are averaged, step series (the cash rate) carry forward. */
function quarterly(m: RawMetric | undefined, pts: Point[]): Point[] {
  if (!pts.length) return [];
  if (m?.chart.kind === 'step') {
    const out: Point[] = []; const first = qEnd(pts[0][0]); const last = qEnd(new Date().toISOString().slice(0, 10));
    let [y, q] = [+first.slice(0, 4), Math.ceil(+first.slice(5, 7) / 3)];
    for (;;) { const d = qEnd(`${y}-${String(q * 3).padStart(2, '0')}-01`); if (d > last) break; const before = pts.filter((p) => p[0] <= d); if (before.length) out.push([d, before[before.length - 1][1]]); q++; if (q > 4) { q = 1; y++; } }
    return out;
  }
  const b = new Map<string, number[]>();
  for (const [d, v] of pts) { const k = qEnd(d); (b.get(k) ?? b.set(k, []).get(k)!).push(v); }
  return [...b].map(([d, vs]) => [d, vs.reduce((a, c) => a + c, 0) / vs.length] as Point).sort((a, c) => a[0].localeCompare(c[0]));
}

function prepared(side: Side, freq: Freq): Point[] {
  const m = metric(side.measure); let pts = raw(side);
  if (freq === 'q' || side.transform === 'fyJune') pts = quarterly(m, pts);
  if (side.transform === 'yoy') {
    const map = new Map(pts); pts = pts.map(([d, v]) => { const prev = map.get(`${+d.slice(0, 4) - 1}${d.slice(4)}`); return prev ? [d, (v / prev - 1) * 100] as Point : null; }).filter(Boolean) as Point[];
  }
  if (side.transform === 'fyJune') pts = pts.filter((p) => p[0].slice(5, 7) === '06');
  return pts;
}

export interface PairData {
  spec: PairSpec; x: Point[]; y: Point[];
  /** For each lag: the matched pairs (x at date minus lag, y at date) and the correlation. */
  byLag: { lag: number; rows: [string, number, number][]; r: number; slope: number; intercept: number }[];
  hasPages: { x: boolean; y: boolean };
}

function fit(rows: [string, number, number][]) {
  const n = rows.length; if (n < 3) return { r: NaN, slope: NaN, intercept: NaN };
  const mx = rows.reduce((a, r) => a + r[1], 0) / n, my = rows.reduce((a, r) => a + r[2], 0) / n;
  let sxx = 0, syy = 0, sxy = 0; for (const [, a, b] of rows) { sxx += (a - mx) ** 2; syy += (b - my) ** 2; sxy += (a - mx) * (b - my); }
  const slope = sxy / sxx; return { r: sxy / Math.sqrt(sxx * syy), slope, intercept: my - slope * mx };
}

function shift(d: string, lag: number, freq: Freq) {
  if (!lag) return d;
  const y = +d.slice(0, 4), m = +d.slice(5, 7);
  if (freq === 'fy') return `${y - lag}${d.slice(4)}`;
  const tm = y * 12 + (m - 1) - lag * 3; const ny = Math.floor(tm / 12), nm = (tm % 12) + 1;
  return qEnd(`${ny}-${String(nm).padStart(2, '0')}-01`);
}

export function pairData(spec: PairSpec): PairData | null {
  const x = prepared(spec.x, spec.freq), y = prepared(spec.y, spec.freq);
  if (x.length < 4 || y.length < 4) return null;
  const xm = new Map(x);
  const byLag = spec.lags.map((lag) => {
    const rows = y.map(([d, vy]) => { const vx = xm.get(shift(d, lag, spec.freq)); return vx == null ? null : [d, vx, vy] as [string, number, number]; }).filter(Boolean) as [string, number, number][];
    return { lag, rows, ...fit(rows) };
  }).filter((l) => l.rows.length >= 6);
  if (!byLag.length) return null;
  const has = (id: string) => MEASURES.some((m) => m.id === id);
  return { spec, x, y, byLag, hasPages: { x: has(spec.x.measure), y: has(spec.y.measure) } };
}

export const PAIR_DATA = PAIRS.map(pairData).filter(Boolean) as PairData[];
