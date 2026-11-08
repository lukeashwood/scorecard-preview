import { describe, expect, test } from 'vitest';
import { MEASURE_SEO, clip } from '../src/lib/seo';
import { CONTROVERSIES } from '../src/lib/controversies';
import { controversyTitle, controversyDescription } from '../src/lib/controversy-seo';
import { pairFor } from '../src/lib/controversy-questions';
import { PAGE_SHARES } from '../src/lib/pageShare';
import { LESSONS } from '../src/lib/learn';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* Standing SEO rule: a search title is shown in full up to about 60 characters. Base.astro adds " | Gov Score" (12 characters)
   to any title of 48 or fewer, so a measure title must stay at 48 or under, and a controversy title at 60 or under either way. */
const SUFFIX = ' | Gov Score';
const full = (t: string) => (t.length > 48 ? t : t + SUFFIX);

describe('search titles and descriptions', () => {
  test('every measure title fits in 60 characters with the site name', () => {
    const long = Object.entries(MEASURE_SEO).filter(([, t]) => full(t).length > 60).map(([id, t]) => `${id} (${full(t).length}): ${t}`);
    expect(long, `Shorten these measure titles to 48 characters or fewer:\n${long.join('\n')}`).toEqual([]);
  });
  test('every controversy title fits in 60 characters', () => {
    const long = CONTROVERSIES.filter((c) => full(controversyTitle(c)).length > 60).map((c) => `${c.id} (${full(controversyTitle(c)).length})`);
    expect(long, `Shorten these controversy titles:\n${long.join('\n')}`).toEqual([]);
  });
  test('every controversy description is between 70 and 160 characters', () => {
    const bad = CONTROVERSIES.filter((c) => { const n = controversyDescription(c).length; return n < 70 || n > 160; }).map((c) => `${c.id} (${controversyDescription(c).length})`);
    expect(bad, `Descriptions outside 70 to 160 characters:\n${bad.join('\n')}`).toEqual([]);
  });
  test('every controversy question pair fits its link preview image without being cut', () => {
    // controversySvg wraps the critical question at 50 characters over 3 lines and the benign one at 64 over 2 lines.
    const long = CONTROVERSIES.map((c) => ({ c, p: pairFor(c.id, c.type) })).filter(({ p }) => p.critical.length > 140 || p.benign.length > 120).map(({ c }) => c.id);
    expect(long, `Question pairs too long for the share image:\n${long.join('\n')}`).toEqual([]);
  });
  test('every page that names a share/page image has one drawn for it', () => {
    // /share/page/<slug>.png is drawn for targets, in-60-seconds, each PAGE_SHARES entry and each learn-<slug> explainer.
    const drawn = new Set(['targets', 'in-60-seconds', ...PAGE_SHARES.map((p) => p.slug), ...LESSONS.map((l) => `learn-${l.slug}`)]);
    const files: string[] = []; const walk = (d: string) => { for (const f of readdirSync(d)) { const q = join(d, f); if (statSync(q).isDirectory()) walk(q); else if (q.endsWith('.astro')) files.push(q); } };
    walk('src/pages');
    const missing = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/share\/page\/([a-z0-9-]+)\.png/g)].map((m) => m[1])).filter((slug) => !drawn.has(slug));
    expect(missing, `No share image is drawn for: ${missing.join(', ')}`).toEqual([]);
    const dup = PAGE_SHARES.map((p) => p.slug).filter((s, i, a) => a.indexOf(s) !== i);
    expect(dup).toEqual([]);
  });
  test('clip cuts at a word and never passes the limit', () => {
    const s = 'word '.repeat(60).trim();
    expect(clip(s, 100).length).toBeLessThanOrEqual(100);
    expect(clip(s, 100).endsWith('…')).toBe(true);
    expect(clip('short text', 100)).toBe('short text');
  });
});
