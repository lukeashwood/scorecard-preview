/* The daily data run's audit log, synced from the pipeline (scripts/sync-data.mjs trims it to what the site shows). */
import raw from '../data/verification.json';
import { MEASURES } from './measures';

export type CheckStatus = 'pass' | 'warn' | 'fail';
export interface Check { metric: string; check: string; status: CheckStatus; critical: boolean; detail: string }
interface RunCounts { generated_at: string; checks_total: number; checks_passed: number; checks_warn: number; checks_failed: number }

const data = raw as unknown as RunCounts & { checks: Check[]; history: RunCounts[] };

export const RUN: RunCounts = { generated_at: data.generated_at, checks_total: data.checks_total, checks_passed: data.checks_passed, checks_warn: data.checks_warn, checks_failed: data.checks_failed };
export const CHECK_LOG: Check[] = data.checks ?? [];
export const RUN_HISTORY: RunCounts[] = data.history ?? [];

/* Checks are keyed by the pipeline's metric id. Most are measures; a few are site-wide. */
const SITE_WIDE: Record<string, string> = {
  sources: 'Source links (every cited URL)',
  controversies: 'Controversies page',
  laws: 'Laws page',
  g20: 'G20 comparisons',
  budget: 'Budget tables',
};
const ORDER = ['pass', 'warn', 'fail'] as const;

export function groupName(metric: string): string {
  return MEASURES.find((m) => m.id === metric)?.title ?? SITE_WIDE[metric] ?? metric.replace(/_/g, ' ');
}
export function groupLink(metric: string): string | null {
  if (MEASURES.some((m) => m.id === metric)) return `measures/${metric}/`;
  if (metric === 'controversies') return 'controversies/';
  if (metric === 'laws') return 'laws/';
  return null;
}

export interface CheckGroup { metric: string; name: string; link: string | null; checks: Check[]; worst: CheckStatus; counts: Record<CheckStatus, number> }

/* Grouped by metric, worst news first: anything with a failure, then warnings, then clean groups, alphabetical within each. */
export function groupedChecks(): CheckGroup[] {
  const by = new Map<string, Check[]>();
  for (const c of CHECK_LOG) by.set(c.metric, [...(by.get(c.metric) ?? []), c]);
  const groups: CheckGroup[] = [...by.entries()].map(([metric, checks]) => {
    const counts = { pass: 0, warn: 0, fail: 0 } as Record<CheckStatus, number>;
    for (const c of checks) counts[c.status]++;
    const worst = counts.fail ? 'fail' : counts.warn ? 'warn' : 'pass';
    const sorted = [...checks].sort((a, b) => ORDER.indexOf(b.status) - ORDER.indexOf(a.status));
    return { metric, name: groupName(metric), link: groupLink(metric), checks: sorted, worst, counts };
  });
  return groups.sort((a, b) => ORDER.indexOf(b.worst) - ORDER.indexOf(a.worst) || a.name.localeCompare(b.name));
}

/* Pull a URL out of a detail string such as "https://example.org/x returned 404" so it can be a link. */
export function splitDetail(detail: string): { url: string | null; text: string } {
  const m = detail.match(/^(https?:\/\/\S+)\s*(.*)$/);
  return m ? { url: m[1], text: m[2] } : { url: null, text: detail };
}
