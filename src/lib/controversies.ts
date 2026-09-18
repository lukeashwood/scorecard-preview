import raw from '../data/controversies.json';
import disputes from '../data/disputes.json';
import { FIVE_PERCENT } from './disputes-five-percent';

export interface Src { title: string; url: string }
/** One strand of a disputed policy: what is claimed, by whom, and what the record shows. */
export interface Point { heading: string; standing: 'established' | 'contested' | 'unverified'; body: string; sources: Src[] }
export interface Controversy {
  id: string; featured?: boolean; date: string; type: 'policy' | 'conduct'; category: string; title: string; minister: string; portfolio: string;
  summary: string; response: string; outcome: string; status: 'ongoing' | 'resolved' | 'no-finding';
  points?: Point[]; figures?: { label: string; value: string; note: string }[]; sources: Src[]; verified_on: string;
}

// Titles that stated a contested figure as fact are reworded so the claim carries its owner.
const RETITLE: Record<string, string> = {
  'Bowen declines to address unmet $275 power-bill pledge as $22.7bn extra billing reported': 'Bowen declines to address unmet $275 power-bill pledge after Coalition analysis claims $22.7bn in extra bills',
};

const legacy: Controversy[] = (raw.items as any[]).map((x) => ({
  id: x.id, date: x.date, title: RETITLE[x.title] ?? x.title, minister: x.minister, portfolio: x.portfolio, category: x.category,
  // "Decisions & judgement" entries are disputes about a policy or decision; the rest question a minister's own conduct.
  type: x.category === 'Decisions & judgement' ? 'policy' : 'conduct',
  summary: x.summary, response: x.response, outcome: x.outcome, status: x.status, sources: x.sources, verified_on: x.verified_on,
}));

export const CONTROVERSIES: Controversy[] = [FIVE_PERCENT, ...(disputes.items as Controversy[]), ...legacy].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.date.localeCompare(a.date));
export const STATUS_LABEL = { ongoing: 'Ongoing', resolved: 'Resolved', 'no-finding': 'No inquiry or finding' } as const;
export const TYPE_LABEL = { policy: 'Policy or decision in dispute', conduct: 'Ministerial conduct' } as const;
export const STANDING_LABEL = { established: 'Established', contested: 'Contested', unverified: 'Not verified' } as const;
