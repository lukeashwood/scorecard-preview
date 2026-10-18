/* The Housing Accord as a count, worked out from the completions series the site already holds. Everything here is
   arithmetic on official figures: homes completed since the Accord began, the even pace needed to reach 1.2 million
   by June 2029, and what that leaves for the remaining quarters. */
import { byId, TODAY } from './measures';

export const ACCORD = { target: 1_200_000, start: '2024-07-01', end: '2029-06-30', quarters: 20 };

export function accordProgress() {
  const m = byId('housing_accord'); if (!m) return null;
  const pts = (m.chart.series?.[0]?.points ?? []).filter((p) => p[0] >= '2024-09-30' && p[0] <= TODAY);
  if (!pts.length) return null;
  const built = pts.reduce((t, p) => t + p[1], 0);
  const elapsed = pts.length;
  const perQuarter = ACCORD.target / ACCORD.quarters;
  const dueByNow = perQuarter * elapsed;
  const remainingQuarters = ACCORD.quarters - elapsed;
  const paceNeeded = remainingQuarters > 0 ? (ACCORD.target - built) / remainingQuarters : 0;
  return { built, elapsed, dueByNow, shortfall: Math.max(0, dueByNow - built), paceNeeded, perQuarter, remainingQuarters, latest: pts[pts.length - 1], first: pts[0], pctOfPace: (built / dueByNow) * 100 };
}
