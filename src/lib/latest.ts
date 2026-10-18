/* "Latest figures": every measure ordered by the date of its newest published data point, so a returning reader can see
   what has landed since their last visit. The site keeps no history of earlier values, so this lists new releases
   rather than old-against-new; the change columns on each measure page carry the comparison. */
import { MEASURES, TODAY } from './measures';
import { daysBetween } from './format';
import type { Measure } from './types';

export interface Latest { m: Measure; date: string; daysAgo: number }

export function latestFigures(limit = 12, withinDays = 45): Latest[] {
  return MEASURES
    .filter((m) => m.lastDataDate)
    .map((m) => ({ m, date: m.lastDataDate!, daysAgo: daysBetween(m.lastDataDate!, TODAY) }))
    .filter((x) => x.daysAgo <= withinDays)
    .sort((a, b) => b.date.localeCompare(a.date) || a.m.title.localeCompare(b.m.title))
    .slice(0, limit);
}
