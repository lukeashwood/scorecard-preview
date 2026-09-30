/* Resident income tax for one person: brackets, low income tax offset, the 2021-22 low and middle income tax offset,
   and the Medicare levy with its low-income phase-in. Sources are listed next to each year's rules. */
export interface TaxRules {
  label: string; brackets: [number, number][]; medicareRate: number; medicareLow: number;
  lito: { max: number; full_to: number; rate1: number; mid_to: number; mid_value: number; rate2: number };
  lmito?: { base: number; base_to: number; rise: number; max: number; max_from: number; max_to: number; fall: number; end: number };
}

const LITO = { max: 700, full_to: 37500, rate1: 0.05, mid_to: 45000, mid_value: 325, rate2: 0.015 };
const OLD_BRACKETS: [number, number][] = [[0, 0], [18200, 19], [45000, 32.5], [120000, 37], [180000, 45]];

/** 2021-22: ATO resident rates; LMITO including the one-off $420 (ATO, "Low and middle income earner tax offsets");
 *  Medicare levy low-income threshold for singles $23,365. */
export const RULES_2122: TaxRules = {
  label: '2021-22', brackets: OLD_BRACKETS, medicareRate: 2, medicareLow: 23365, lito: LITO,
  lmito: { base: 675, base_to: 37000, rise: 0.075, max: 1500, max_from: 48000, max_to: 90000, fall: 0.03, end: 126000 },
};
/** 2022-23: same rates, LMITO ended; Medicare threshold $24,276. */
export const RULES_2223: TaxRules = { label: '2022-23', brackets: OLD_BRACKETS, medicareRate: 2, medicareLow: 24276, lito: LITO };
/** 2025-26: rates after the July 2024 changes (16%, 30%, 37%, 45%); Medicare threshold $28,011. */
export const RULES_2526: TaxRules = { label: '2025-26', brackets: [[0, 0], [18200, 16], [45000, 30], [135000, 37], [190000, 45]], medicareRate: 2, medicareLow: 28011, lito: LITO };

export function incomeTax(x: number, r: TaxRules, dropLmito = false) {
  let t = 0; const b = r.brackets;
  for (let i = 0; i < b.length; i++) { const lo = b[i][0], hi = i + 1 < b.length ? b[i + 1][0] : Infinity; if (x > lo) t += (Math.min(x, hi) - lo) * b[i][1] / 100; }
  const L = r.lito; const lito = x <= L.full_to ? L.max : x <= L.mid_to ? L.max - (x - L.full_to) * L.rate1 : Math.max(0, L.mid_value - (x - L.mid_to) * L.rate2);
  let lmito = 0; const M = r.lmito;
  if (M && !dropLmito) lmito = x <= M.base_to ? M.base : x <= M.max_from ? Math.min(M.max, M.base + (x - M.base_to) * M.rise) : x <= M.max_to ? M.max : x <= M.end ? Math.max(0, M.max - (x - M.max_to) * M.fall) : 0;
  t = Math.max(0, t - lito - lmito);
  const lo = r.medicareLow, hi = lo * 1.25;
  return t + (x <= lo ? 0 : x <= hi ? (x - lo) * 0.1 : x * r.medicareRate / 100);
}
