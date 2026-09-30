/* One clean, factual line per measure, for sharing. It states the figure, the period, the change since the government
   took office and the source, and nothing else: no adjectives, no verdict unless it is a commitment. */
import { headlineText } from './format';
import type { Measure } from './types';

export function shareText(m: Measure): string {
  const pubs = [...new Set(m.sources.map((s) => s.publisher))].slice(0, 2).join(', ');
  const since = m.sinceElection ? ` Since the government took office: ${m.sinceElection.label} (${m.sinceElection.periodLabel}).` : '';
  const verdict = m.verdict && m.ed.target?.owner === 'government' ? ` Commitment: ${m.ed.target.commitment}` : '';
  return `${m.title}: ${headlineText(m.headline)} ${m.headline.caption}${m.headline.period ? `, ${m.headline.period}` : ''}.${since}${verdict} Source: ${pubs}.`;
}
