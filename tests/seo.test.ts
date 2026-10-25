import { describe, expect, test } from 'vitest';
import { MEASURE_SEO, clip } from '../src/lib/seo';
import { CONTROVERSIES } from '../src/lib/controversies';
import { controversyTitle, controversyDescription } from '../src/lib/controversy-seo';

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
  test('clip cuts at a word and never passes the limit', () => {
    const s = 'word '.repeat(60).trim();
    expect(clip(s, 100).length).toBeLessThanOrEqual(100);
    expect(clip(s, 100).endsWith('…')).toBe(true);
    expect(clip('short text', 100)).toBe('short text');
  });
});
