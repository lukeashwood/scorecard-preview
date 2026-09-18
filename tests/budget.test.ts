import { describe, expect, it } from 'vitest';
import raw from '../src/data/metrics.json';
import { createModel, bn, type BudgetYear, type Rates } from '../src/lib/budget/model';

const Y = (raw as any).budget.years[0] as BudgetYear;
const M = createModel(Y);
const BAD = /NaN|Infinity|undefined|e\+|−−|\$-/;
const text = (s: ReturnType<typeof M.summary>) => JSON.stringify(s);

describe('baseline', () => {
  it('starts from the published Budget', () => {
    const s = M.summary(M.initial());
    expect(Math.abs(s.rev - Y.revenue.reduce((a, l) => a + l.value_m, 0))).toBeLessThan(1); expect(Math.abs(s.rev - 815328)).toBeLessThan(5); expect(s.changed).toBe(false);
  });
  it('reproduces the income tax scale', () => {
    expect(Math.round(M.personTax(100000, M.baseRates!))).toBe(22520);
    expect(Math.round(M.personTax(30000, M.baseRates!))).toBe(1269);
    expect(M.personTax(0, M.baseRates!)).toBe(0); expect(M.personTax(-5, M.baseRates!)).toBe(0);
  });
});

describe('extreme inputs never leak nonsense', () => {
  it('zero revenue', () => {
    let s = M.initial(); M.names.revenue.forEach((_, i) => { s = M.setLine(s, 'revenue', i, 0, 'deficit').state; });
    const r = M.summary(s); expect(r.rev).toBe(0); expect(r.pitRise).toBeNull(); expect(r.spendPerDollar).toBeNull(); expect(text(r)).not.toMatch(BAD);
  });
  it('zero spending clears debt but never makes it negative', () => {
    let s = M.initial(); M.names.expenses.forEach((_, i) => { s = M.setLine(s, 'expenses', i, 0, 'deficit').state; });
    const r = M.summary(s); expect(r.debt).toBeGreaterThanOrEqual(0); expect(r.spendCut).toBeNull();
  });
  it('absurd values are capped with a message', () => {
    const r = M.setLine(M.initial(), 'expenses', 0, 1e300, 'deficit');
    expect(r.state.expenses[0]).toBe(M.cap('expenses', 0)); expect(r.note).toMatch(/capped/); expect(bn(1e300)).not.toMatch(BAD);
  });
  it('ignores NaN, negative and out-of-range indexes', () => {
    const s0 = M.initial();
    expect(M.setLine(s0, 'revenue', 0, NaN, 'deficit').state.revenue[0]).toBe(s0.revenue[0]);
    expect(M.setLine(s0, 'revenue', 0, -50, 'deficit').state.revenue[0]).toBe(0);
    expect(M.setLine(s0, 'revenue', 99, 5, 'deficit').state).toEqual(s0);
  });
});

describe('paying for changes', () => {
  it('keeps the bottom line fixed when it can', () => {
    const b0 = M.summary(M.initial()).bal;
    const r = M.setLine(M.initial(), 'expenses', M.I.defence, M.base.expenses[M.I.defence] + 20000, 'spending');
    expect(Math.abs(M.summary(r.state).bal - b0)).toBeLessThan(1); expect(r.state.expenses[M.I.interest]).toBe(M.base.expenses[M.I.interest]);
  });
  it('recovers after other lines were pushed to zero', () => {
    let r = M.setLine(M.initial(), 'expenses', 0, M.cap('expenses', 0), 'spending'); // squeezes the rest
    r = M.setLine(r.state, 'expenses', 0, M.base.expenses[0], 'spending');            // and back
    const others = r.state.expenses.filter((_, i) => i !== 0 && i !== M.I.interest);
    expect(others.every((v) => v > 0)).toBe(true);
  });
  it('says honestly when a balance preset cannot balance', () => {
    let s = M.initial(); M.names.revenue.forEach((_, i) => { s = M.setLine(s, 'revenue', i, 0, 'deficit').state; });
    const r = M.preset(s, 'cuts', 'deficit'); expect(r.note).toMatch(/remains/);
    const ok = M.preset(M.initial(), 'taxes', 'deficit'); expect(Math.abs(M.summary(ok.state).bal)).toBeLessThan(1); expect(ok.note).toMatch(/balances/);
  });
  it('income tax preset does not compound', () => {
    const a = M.preset(M.initial(), 'pit', 'deficit').state, b = M.preset(a, 'pit', 'deficit').state;
    expect(b.revenue[M.I.pit]).toBeCloseTo(a.revenue[M.I.pit], 3);
  });
});

describe('tax rates', () => {
  const t = (): Rates => JSON.parse(JSON.stringify(M.baseRates));
  it('GST scales in proportion', () => { const r = t(); r.gst = 15; expect(M.gstFromRates(r)).toBeCloseTo(M.base.revenue[M.I.gst] * 1.5, 3); });
  it('rejects out-of-order or out-of-range rates', () => {
    const a = t(); a.br[2][0] = 1000; expect(M.validRates(a)).toBe(false);
    const b = t(); b.gst = 1e9; expect(M.validRates(b)).toBe(false);
    const c = t(); c.ml = 999999; expect(M.validRates(c)).toBe(false);
    const d = t(); d.br[4][1] = 100; expect(M.validRates(d)).toBe(true);
  });
  it('splitting costs money and couples-with-children costs less than all couples', () => {
    const all = t(); all.split = 1; const kids = t(); kids.split = 2;
    expect(M.splitCost(all)).toBeGreaterThan(M.splitCost(kids)); expect(M.splitCost(kids)).toBeGreaterThan(0);
    expect(M.splitGain(150000, 0, t())).toBeCloseTo(10530, 0); expect(M.splitGain(80000, 80000, t())).toBe(0);
  });
});

describe('shared links are never trusted', () => {
  it('survives garbage', () => {
    for (const h of ['#%E0%A4%A', '#v1:r=1;e=2', '#v2:r=NaN', '#<script>', '', '#v1:r=1e300,1,1,1,1,1;e=1,1,1,1,1,1,1']) expect(() => M.decode(h)).not.toThrow();
    expect(M.decode('#%E0%A4%A')).toBeNull();
  });
  it('round-trips and clamps', () => {
    const s = M.setLine(M.initial(), 'revenue', 0, 300000, 'deficit').state; s.rates!.gst = 12.5; s.rates!.split = 2;
    const back = M.decode('#' + encodeURIComponent(M.encode(s)))!; expect(back.revenue[0]).toBe(300000); expect(back.rates!.gst).toBe(12.5); expect(back.rates!.split).toBe(2);
    const huge = M.decode('#v1:r=99999999999,1,1,1,1,1;e=1,1,1,1,1,1,1')!; expect(huge.revenue[0]).toBe(M.cap('revenue', 0));
    const badT = M.decode('#v1:r=1,1,1,1,1,1;e=1,1,1,1,1,1,1;t=10_2_0:0_190000:15_45000:30_135000:37_190000:45_0')!; expect(badT.rates).toEqual(M.baseRates);
  });
});
