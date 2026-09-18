/* Build-your-own-Budget engine. Pure functions, no DOM, so every rule can be unit-tested against silly inputs.
   All money is in $ million. It is budget arithmetic on the government's published figures, not an economic model. */

export interface Line { name: string; value_m: number }
export interface TaxRatesData {
  income_year: string; gst_rate: number; brackets: [number, number][]; medicare_levy: number; medicare_low: number;
  lito?: { max: number; full_to: number; rate1: number; mid_to: number; mid_value: number; rate2: number };
  distribution: { growth: number; bands: [number, number | null, number, number][]; income_year: string; url: string };
  couples?: { growth: number; cells: [number, number, number][]; count: number; income_year: string; url: string; pbo?: { cost_m: number; brackets: [number, number][]; year: string; url: string; source: string; design: string } };
  brackets_url?: string; lito_url?: string;
}
export interface BudgetYear {
  year: string; gdp_m: number; population: number; defence_funding_m: number; gross_debt_bn: number; gross_debt_prior_bn?: number;
  revenue: Line[]; expenses: Line[]; tax_rates?: TaxRatesData; url?: string; document?: string;
}
export type Kind = 'revenue' | 'expenses';
export type Mode = 'deficit' | 'spending' | 'taxes';
export interface Rates { gst: number; ml: number; br: [number, number][]; split: 0 | 1 | 2 }
export interface State { revenue: number[]; expenses: number[]; rates: Rates | null }

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function createModel(Y: BudgetYear) {
  const GDP = Y.gdp_m, TX = Y.tax_rates ?? null;
  const names = { revenue: Y.revenue.map((l) => l.name), expenses: Y.expenses.map((l) => l.name) };
  const base = { revenue: Y.revenue.map((l) => l.value_m), expenses: Y.expenses.map((l) => l.value_m) };
  const find = (k: Kind, re: RegExp) => names[k].findIndex((n) => re.test(n));
  const I = {
    interest: find('expenses', /interest/i), defence: find('expenses', /^defence/i),
    nontax: find('revenue', /non-tax/i), pit: find('revenue', /personal income/i), gst: find('revenue', /^gst/i),
  };
  // A line can go to zero, and up to three times its Budget size or 10% of GDP, whichever is larger. Beyond that the
  // arithmetic stops meaning anything, so the tool says so instead of printing a 300-digit number.
  const cap = (k: Kind, i: number) => Math.max(base[k][i] * 3, GDP * 0.1);
  const baseRates: Rates | null = TX ? { gst: TX.gst_rate, ml: TX.medicare_levy, br: TX.brackets.map((b) => [b[0], b[1]] as [number, number]), split: 0 } : null;
  const initial = (): State => ({ revenue: [...base.revenue], expenses: [...base.expenses], rates: baseRates ? cloneRates(baseRates) : null });

  /* ---------------------------------------------------------------- paying for a change */
  const eligible = (k: Kind, except: number) => base[k].map((_, j) => j).filter((j) => j !== except && !(k === 'expenses' && j === I.interest) && !(k === 'revenue' && j === I.nontax));

  /** Move `amount` across the other lines on one side. Shares follow the BUDGET's proportions, not the current ones, so a
      line that has been pushed to zero can come back. Respects the floor (0) and each line's cap. Returns what didn't fit. */
  function spread(s: State, k: Kind, amount: number, except: number): number {
    let left = amount; let pool = eligible(k, except);
    for (let pass = 0; pass < 6 && Math.abs(left) > 0.5 && pool.length; pass++) {
      const w = sum(pool.map((j) => base[k][j])) || pool.length; const next: number[] = []; let applied = 0;
      for (const j of pool) {
        const share = left * ((base[k][j] || 1) / w); const to = clamp(s[k][j] + share, 0, cap(k, j));
        applied += to - s[k][j]; s[k][j] = to;
        if (to > 0 && to < cap(k, j)) next.push(j);
      }
      left -= applied; pool = next;
    }
    return Math.abs(left) < 0.5 ? 0 : left;
  }

  function setLine(prev: State, k: Kind, i: number, value: number, mode: Mode): { state: State; note: string } {
    const s = cloneState(prev); if (!finite(value) || i < 0 || i >= s[k].length) return { state: s, note: '' };
    const v = clamp(value, 0, cap(k, i)); const delta = v - s[k][i];
    let note = value > cap(k, i) ? `${names[k][i]} is capped at ${bn(cap(k, i), 0)}: beyond that the sums stop meaning anything.` : '';
    if (!delta) return { state: s, note };
    s[k][i] = v;
    // What has to change elsewhere to leave the bottom line where it was.
    let left = 0, side: Kind | null = null;
    if (mode === 'spending') { side = 'expenses'; left = spread(s, 'expenses', k === 'expenses' ? -delta : delta, k === 'expenses' ? i : -1); }
    if (mode === 'taxes') { side = 'revenue'; left = spread(s, 'revenue', k === 'revenue' ? -delta : delta, k === 'revenue' ? i : -1); }
    if (side && left) {
      const what = side === 'expenses' ? 'other spending' : 'other taxes';
      note = (note ? note + ' ' : '') + (left < 0
        ? `There wasn’t enough ${what} left to cut, so ${bn(Math.abs(left))} of this change goes to the bottom line instead.`
        : `${what[0].toUpperCase() + what.slice(1)} hit its upper limit, so ${bn(left)} of this change goes to the bottom line instead.`);
    }
    return { state: s, note };
  }

  /* ---------------------------------------------------------------- personal income tax */
  function personTax(x: number, t: Rates): number {
    if (!TX || !(x > 0)) return 0;
    let tax = 0;
    t.br.forEach((b, k) => { const lo = b[0], hi = k + 1 < t.br.length ? t.br[k + 1][0] : Infinity; if (x > lo) tax += (Math.min(x, hi) - lo) * b[1] / 100; });
    const L = TX.lito; let lito = 0;
    if (L) lito = x <= L.full_to ? L.max : x <= L.mid_to ? L.max - (x - L.full_to) * L.rate1 : Math.max(0, L.mid_value - (x - L.mid_to) * L.rate2);
    tax = Math.max(0, tax - lito);
    const low = TX.medicare_low || 0;
    const levy = x <= low ? 0 : Math.min(0.1 * (x - low), x * t.ml / 100);
    return tax + levy;
  }
  // The ATO's count of taxpayers and total income in each income band, spread over five points per band and grown to
  // the Budget year by wage growth.
  const POINTS: [number, number][] = [];
  if (TX) for (const [lo, hi, n, total] of TX.distribution.bands) {
    if (!n) continue; const mean = total / n; let xs: number[];
    if (hi == null) xs = [mean]; else { xs = [0, 1, 2, 3, 4].map((q) => lo + (q + 0.5) / 5 * (hi - lo)); const avg = sum(xs) / 5; const f = avg ? mean / avg : 1; xs = xs.map((x) => x * f); }
    for (const x of xs) POINTS.push([x * (TX.distribution.growth || 1), n / xs.length]);
  }
  const totalTax = (t: Rates) => POINTS.reduce((a, [x, n]) => a + n * personTax(x, t), 0);
  const BASE_TOTAL = baseRates ? totalTax(baseRates) : 0;
  const CP = TX?.couples?.cells?.length ? TX.couples.cells.map(([a, b, n]) => [a * TX.couples!.growth, b * TX.couples!.growth, n] as [number, number, number]) : null;
  const splitGain = (x: number, y: number, t: Rates) => Math.max(0, personTax(x, t) + personTax(y, t) - 2 * personTax((x + y) / 2, t));
  const splitCostAll = (t: Rates) => (CP ? CP.reduce((a, [x, y, n]) => a + n * splitGain(x, y, t), 0) / 1e6 : 0); // $m
  const pbo = TX?.couples?.pbo;
  const KIDS_SHARE = CP && pbo && baseRates && Array.isArray(pbo.brackets) ? (() => { const all = splitCostAll({ ...baseRates, br: pbo.brackets }); return all > 0 ? Math.min(1, pbo.cost_m / all) : 0; })() : 0;
  const splitCost = (t: Rates) => (t.split === 1 ? splitCostAll(t) : t.split === 2 ? splitCostAll(t) * KIDS_SHARE : 0);
  const taxOK = !!(TX && baseRates && BASE_TOTAL > 0 && I.pit >= 0 && I.gst >= 0);
  const pitFromRates = (t: Rates) => Math.max(0, base.revenue[I.pit] * totalTax(t) / BASE_TOTAL - splitCost(t));
  const gstFromRates = (t: Rates) => base.revenue[I.gst] * t.gst / (baseRates!.gst || 1);

  /** Thresholds must rise from bracket to bracket; rates live in 0–100; GST 0–50; Medicare levy 0–10. */
  function validRates(t: Rates | null | undefined): t is Rates {
    if (!t || !baseRates || !Array.isArray(t.br) || t.br.length !== baseRates.br.length) return false;
    if (![t.gst, t.ml].every(finite) || t.gst < 0 || t.gst > 50 || t.ml < 0 || t.ml > 10 || ![0, 1, 2].includes(t.split)) return false;
    return t.br.every((b, k) => Array.isArray(b) && finite(b[0]) && finite(b[1]) && b[1] >= 0 && b[1] <= 100 && b[0] >= 0 && b[0] <= 5e6 && (k === 0 ? b[0] === 0 : b[0] > t.br[k - 1][0]));
  }
  function applyRates(prev: State, t: Rates, mode: Mode): { state: State; note: string } {
    if (!taxOK || !validRates(t)) return { state: prev, note: '' };
    let r = setLine({ ...prev, rates: cloneRates(t) }, 'revenue', I.gst, gstFromRates(t), mode);
    const r2 = setLine(r.state, 'revenue', I.pit, pitFromRates(t), mode);
    r2.state.rates = cloneRates(t);
    return { state: r2.state, note: [r.note, r2.note].filter(Boolean).join(' ') };
  }

  /* ---------------------------------------------------------------- results */
  function summary(s: State) {
    const rev = sum(s.revenue), exp = sum(s.expenses), bal = rev - exp;
    const baseBal = sum(base.revenue) - sum(base.expenses), dBal = bal - baseBal;
    const debt0 = Y.gross_debt_bn * 1000, prior = (Y.gross_debt_prior_bn ?? Y.gross_debt_bn) * 1000;
    const rate = I.interest >= 0 && debt0 + prior > 0 ? base.expenses[I.interest] / ((debt0 + prior) / 2) : 0;
    const debt = Math.max(0, debt0 - dBal);
    const defFund = I.defence >= 0 ? Y.defence_funding_m + (s.expenses[I.defence] - base.expenses[I.defence]) : null;
    const pit = I.pit >= 0 ? s.revenue[I.pit] : 0, cuttable = exp - (I.interest >= 0 ? s.expenses[I.interest] : 0);
    return {
      rev, exp, bal, baseBal, dBal, balanced: Math.abs(bal) < 50, changed: Math.abs(dBal) >= 50,
      perPerson: Y.population > 0 ? (dBal * 1e6) / Y.population : null,
      debt, debt0, debtCleared: debt0 - dBal <= 0, rate, interestDelta: -dBal * rate,
      defencePct: defFund != null && GDP > 0 ? (defFund / GDP) * 100 : null, baseDefencePct: GDP > 0 ? (Y.defence_funding_m / GDP) * 100 : null,
      // How far income tax would need to rise, or non-interest spending fall, to balance. null = not possible/meaningful.
      pitRise: bal < -50 && pit > 0 ? (-bal / pit) * 100 : null,
      spendCut: bal < -50 && cuttable > 0 ? (-bal / cuttable) * 100 : null,
      spendPerDollar: rev > 0 ? exp / rev : null, baseSpendPerDollar: sum(base.expenses) / sum(base.revenue),
    };
  }

  /* ---------------------------------------------------------------- examples */
  function preset(prev: State, which: 'defence' | 'pit' | 'cuts' | 'taxes', mode: Mode): { state: State; note: string } {
    if (which === 'defence' && I.defence >= 0) {
      const target = base.expenses[I.defence] + (0.035 * GDP - Y.defence_funding_m);
      const r = setLine(prev, 'expenses', I.defence, target, mode);
      return { state: r.state, note: `Defence set so funding reaches 3.5% of GDP (${bn(0.035 * GDP)}), ${bn(0.035 * GDP - Y.defence_funding_m)} a year more than the Budget. ${r.note}`.trim() };
    }
    if (which === 'pit' && I.pit >= 0) { // always 10% below the BUDGET figure, so pressing twice doesn't compound
      const r = setLine(prev, 'revenue', I.pit, base.revenue[I.pit] * 0.9, mode);
      return { state: r.state, note: `Personal income tax set 10% below the Budget. ${r.note}`.trim() };
    }
    const s = cloneState(prev); const gap = sum(s.revenue) - sum(s.expenses);
    const left = which === 'cuts' ? spread(s, 'expenses', gap, -1) : spread(s, 'revenue', -gap, -1);
    const what = which === 'cuts' ? 'Spending other than interest' : 'Taxes';
    return { state: s, note: left ? `${what} moved as far as the limits allow, but ${bn(Math.abs(left))} of the gap remains.` : `${what} scaled, in the Budget’s proportions, until the budget balances.` };
  }

  /* ---------------------------------------------------------------- share links (never trusted) */
  const encode = (s: State) => `v2:r=${s.revenue.map(Math.round).join(',')};e=${s.expenses.map(Math.round).join(',')}` + (s.rates ? `;t=${[s.rates.gst, s.rates.ml, ...s.rates.br.map((b) => b[0] + ':' + b[1]), s.rates.split].join('_')}` : '');
  function decode(hash: string): State | null {
    let str: string; try { str = decodeURIComponent(hash.replace(/^#/, '')); } catch { return null; }
    const m = /^v[12]:r=([\d,.]+);e=([\d,.]+)(?:;t=([\d.:_]+))?(?:;m=[\d_]+)?$/.exec(str); if (!m) return null;
    const r = m[1].split(',').map(Number), e = m[2].split(',').map(Number);
    if (r.length !== base.revenue.length || e.length !== base.expenses.length || ![...r, ...e].every((x) => finite(x) && x >= 0)) return null;
    const s: State = { revenue: r.map((v, i) => clamp(v, 0, cap('revenue', i))), expenses: e.map((v, i) => clamp(v, 0, cap('expenses', i))), rates: baseRates ? cloneRates(baseRates) : null };
    if (m[3] && baseRates) {
      const p = m[3].split('_'), n = baseRates.br.length;
      const t: Rates = { gst: Number(p[0]), ml: Number(p[1]), br: p.slice(2, 2 + n).map((x) => x.split(':').map(Number) as [number, number]), split: ([0, 1, 2].includes(Number(p[2 + n])) ? Number(p[2 + n]) : 0) as 0 | 1 | 2 };
      if (validRates(t)) s.rates = t; // anything out of range or out of order is dropped, never rendered
    }
    return s;
  }

  return { Y, GDP, TX, names, base, I, cap, baseRates, initial, setLine, spread, applyRates, validRates, personTax, totalTax, splitGain, splitCostAll, splitCost, KIDS_SHARE, taxOK, couplesOK: !!CP, pitFromRates, gstFromRates, summary, preset, encode, decode };
}

export const cloneRates = (t: Rates): Rates => ({ gst: t.gst, ml: t.ml, br: t.br.map((b) => [b[0], b[1]] as [number, number]), split: t.split });
export const cloneState = (s: State): State => ({ revenue: [...s.revenue], expenses: [...s.expenses], rates: s.rates ? cloneRates(s.rates) : null });

/** "$12.3bn" from $ million. Never prints NaN, Infinity or scientific notation. */
export function bn(m: number, d = 1): string {
  if (!Number.isFinite(m)) return '–';
  const v = Math.abs(m) / 1000; const body = v >= 1e6 ? 'over $1,000,000' : '$' + v.toLocaleString('en-AU', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (m < 0 && v >= 0.05 ? '−' : '') + body + 'bn';
}
export const pctOf = (v: number, of: number, d = 1) => (of > 0 && Number.isFinite(v) ? (v / of * 100).toFixed(d) + '%' : '–');
export const dollars = (v: number) => (Number.isFinite(v) ? '$' + Math.round(Math.abs(v)).toLocaleString('en-AU') : '–');
