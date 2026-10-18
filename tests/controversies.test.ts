import { describe, expect, test } from 'vitest';
import { CONTROVERSIES } from '../src/lib/controversies';
import { QUESTIONS } from '../src/lib/controversy-questions';

/* Standing rule: every controversy is headed by 2 questions, one critical and one benign, and ends with them again
   followed by "You decide." A new entry without its pair fails the build so it cannot be published half-done. */
describe('controversy questions', () => {
  test('every controversy has a hand-written pair of questions', () => {
    const missing = CONTROVERSIES.filter((c) => !QUESTIONS[c.id]).map((c) => c.id);
    expect(missing, `Add a critical and a benign question for: ${missing.join(', ')}`).toEqual([]);
  });
  test('each pair is 2 questions, the second starting with "Or"', () => {
    for (const [id, q] of Object.entries(QUESTIONS)) {
      expect(q.critical.trim().endsWith('?'), `${id}: critical question must end with ?`).toBe(true);
      expect(q.benign.trim().endsWith('?'), `${id}: benign question must end with ?`).toBe(true);
      expect(/^Or\b/.test(q.benign.trim()), `${id}: benign question should start with "Or"`).toBe(true);
    }
  });
  test('no stale keys', () => {
    const ids = new Set(CONTROVERSIES.map((c) => c.id));
    const stale = Object.keys(QUESTIONS).filter((k) => !ids.has(k));
    expect(stale, `Questions for entries that no longer exist: ${stale.join(', ')}`).toEqual([]);
  });
});

/* Internal links between controversy pages and measure pages: every id in the map must exist on both sides, so a
   renamed or retired measure cannot leave a dead link. */
describe('controversy to measure links', () => {
  test('every mapped id exists', async () => {
    const { CONTROVERSY_MEASURES } = await import('../src/lib/controversy-measures');
    const { MEASURES } = await import('../src/lib/measures');
    const cids = new Set(CONTROVERSIES.map((c) => c.id)), mids = new Set(MEASURES.map((m) => m.id));
    const badC = Object.keys(CONTROVERSY_MEASURES).filter((k) => !cids.has(k));
    const badM = Object.values(CONTROVERSY_MEASURES).flat().filter((k) => !mids.has(k));
    expect(badC, `Unknown controversy ids: ${badC.join(', ')}`).toEqual([]);
    expect(badM, `Unknown measure ids: ${badM.join(', ')}`).toEqual([]);
  });
});
