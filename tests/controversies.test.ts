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
