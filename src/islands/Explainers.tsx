import { useMemo, useState } from 'react';
import { createModel, bn, dollars, type BudgetYear } from '../lib/budget/model';

const K = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--k5)', 'var(--k6)', 'var(--k7)'];
const Slider = ({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) => (
  <label className="grid gap-1 text-[14px] font-semibold text-ink-2"><span className="flex items-baseline justify-between gap-3"><span>{label}</span><span className="num font-display text-[22px] font-semibold text-ink">{fmt(value)}</span></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={fmt(value)} /></label>);
const Stat = ({ l, v, s }: { l: string; v: string; s?: string }) => <div className="bg-surface px-4 py-3"><dt className="eyebrow">{l}</dt><dd className="num font-display text-[26px] font-semibold leading-tight">{v}</dd>{s && <dd className="meta">{s}</dd>}</div>;
const Stats = ({ children }: { children: React.ReactNode }) => <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-rule bg-rule sm:grid-cols-3">{children}</dl>;

/* ------------------------------------------------------------------ 1. Your tax receipt */
export function TaxReceipt({ year }: { year: BudgetYear }) {
  const M = useMemo(() => createModel(year), [year]); const [income, setIncome] = useState(85000);
  if (!M.taxOK || !M.baseRates) return <p className="meta">Tax data isn’t available for this Budget year.</p>;
  const t = M.baseRates, tax = M.personTax(income, t);
  const total = M.base.expenses.reduce((a, b) => a + b, 0);
  const slices = t.br.map((b, k) => { const lo = b[0], hi = t.br[k + 1]?.[0] ?? Infinity; return { lo, hi, rate: b[1], amount: Math.max(0, Math.min(income, hi) - lo) }; }).filter((s) => s.amount > 0);
  const marginal = slices[slices.length - 1]?.rate ?? 0;
  return (
    <div className="grid gap-6">
      <Slider label="Your taxable income for the year" value={income} min={0} max={400000} step={1000} onChange={setIncome} fmt={dollars} />
      <Stats><Stat l="Income tax and Medicare levy" v={dollars(tax)} s={`${dollars(tax / 52)} a week`} /><Stat l="Share of your income" v={income ? (tax / income * 100).toFixed(1) + '%' : '0%'} s="your average rate" /><Stat l="On your next dollar" v={`${marginal + (income > (M.TX!.medicare_low || 0) ? t.ml : 0)}c`} s="your marginal rate, incl. Medicare levy" /></Stats>
      <div><h3 className="h3">How your income is taxed, slice by slice</h3><p className="meta">You don’t pay your top rate on everything. Each slice of income is taxed at its own rate.</p>
        <div className="mt-3 flex h-10 overflow-hidden rounded-lg border border-rule" role="img" aria-label={slices.map((s) => `${dollars(s.amount)} taxed at ${s.rate}%`).join(', ')}>{slices.map((s, i) => <div key={s.lo} title={`${dollars(s.amount)} at ${s.rate}%`} style={{ flex: s.amount, background: K[i], opacity: s.rate === 0 ? 0.25 : 1 }} />)}</div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-ink-2">{slices.map((s, i) => <li key={s.lo} className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: K[i], opacity: s.rate === 0 ? 0.25 : 1 }} /><span className="num">{dollars(s.amount)}</span> at {s.rate}% = <b className="num text-ink">{dollars(s.amount * s.rate / 100)}</b></li>)}</ul></div>
      <div><h3 className="h3">Where your {dollars(tax)} goes</h3><p className="meta">Your tax, shared out the way the {year.year} Budget shares out all federal spending.</p>
        <table className="mt-3 w-full text-[14.5px]"><tbody>{M.names.expenses.map((n, i) => { const share = M.base.expenses[i] / total; return <tr key={n} className="border-t border-rule first:border-0"><td className="py-2 pr-3"><span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: K[i % 7] }} />{n}</td><td className="w-[38%] py-2 pr-3"><span className="block h-2.5 rounded bg-panel"><span className="block h-2.5 rounded" style={{ width: `${share * 100 / 0.4}%`, maxWidth: '100%', background: K[i % 7] }} /></span></td><td className="num py-2 text-right font-semibold">{dollars(tax * share)}</td><td className="num py-2 pl-3 text-right text-ink-3">{dollars(tax * share / 52)}/wk</td></tr>; })}</tbody></table></div>
    </div>);
}

/* ------------------------------------------------------------------ 2. Deficit vs debt */
export function DeficitDebt({ year }: { year: BudgetYear }) {
  const debt0 = year.gross_debt_bn, [bal, setBal] = useState(-30), [rate, setRate] = useState(3.5);
  const path = useMemo(() => { const out = [{ y: 0, debt: debt0, interest: debt0 * rate / 100 }]; for (let y = 1; y <= 10; y++) { const d = Math.max(0, out[y - 1].debt - bal); out.push({ y, debt: d, interest: d * rate / 100 }); } return out; }, [bal, rate, debt0]);
  const max = Math.max(...path.map((p) => p.debt), debt0) * 1.08, end = path[10];
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2"><Slider label={bal < 0 ? 'Deficit every year' : bal > 0 ? 'Surplus every year' : 'Balanced every year'} value={bal} min={-100} max={100} step={5} onChange={setBal} fmt={(v) => `$${Math.abs(v)}bn`} /><Slider label="Interest rate on the debt" value={rate} min={1} max={8} step={0.25} onChange={setRate} fmt={(v) => v.toFixed(2) + '%'} /></div>
      <Stats><Stat l="Debt today" v={`$${Math.round(debt0).toLocaleString('en-AU')}bn`} /><Stat l="Debt in 10 years" v={`$${Math.round(end.debt).toLocaleString('en-AU')}bn`} s={end.debt > debt0 ? 'higher' : end.debt < debt0 ? 'lower' : 'unchanged'} /><Stat l="Interest bill in year 10" v={`$${end.interest.toFixed(1)}bn`} s={`vs $${path[0].interest.toFixed(1)}bn today`} /></Stats>
      <div role="img" aria-label={`Debt path over ten years, from ${Math.round(debt0)} to ${Math.round(end.debt)} billion dollars`} className="flex h-[220px] items-end gap-1.5 border-b border-rule-strong">{path.map((p) => <div key={p.y} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="num text-[11px] text-ink-3">{Math.round(p.debt)}</span><div className="w-full rounded-t-[4px]" style={{ height: `${p.debt / max * 180}px`, background: p.y === 0 ? 'var(--c4)' : 'var(--c1)', transition: 'height 220ms cubic-bezier(0.23,1,0.32,1)' }} /></div>)}</div>
      <div className="-mt-4 flex gap-1.5 text-center text-[11.5px] text-ink-3">{path.map((p) => <span key={p.y} className="flex-1">{p.y === 0 ? 'Now' : `+${p.y}`}</span>)}</div>
      <p className="text-[15.5px] text-ink-2">The <b className="text-ink">deficit</b> is the tap: how much more the government spends than it raises in one year. The <b className="text-ink">debt</b> is the bath: everything borrowed so far and not yet repaid. Turning the tap down (a smaller deficit) still fills the bath. Only a surplus lowers the level.</p>
    </div>);
}

/* ------------------------------------------------------------------ 3. Inflation and your pay */
export function InflationPay() {
  const [inf, setInf] = useState(3.5), [pay, setPay] = useState(3.2), [years, setYears] = useState(5), [wage, setWage] = useState(90000);
  const prices = Math.pow(1 + inf / 100, years), wages = Math.pow(1 + pay / 100, years), real = wages / prices;
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2"><Slider label="Prices rise each year by" value={inf} min={0} max={10} step={0.1} onChange={setInf} fmt={(v) => v.toFixed(1) + '%'} /><Slider label="Your pay rises each year by" value={pay} min={0} max={10} step={0.1} onChange={setPay} fmt={(v) => v.toFixed(1) + '%'} /><Slider label="For this many years" value={years} min={1} max={20} step={1} onChange={setYears} fmt={(v) => `${v} year${v > 1 ? 's' : ''}`} /><Slider label="Your pay today" value={wage} min={30000} max={250000} step={1000} onChange={setWage} fmt={dollars} /></div>
      <Stats><Stat l="A $100 shop will cost" v={'$' + (100 * prices).toFixed(0)} s={`prices up ${((prices - 1) * 100).toFixed(0)}%`} /><Stat l="Your pay will be" v={dollars(wage * wages)} s={`up ${((wages - 1) * 100).toFixed(0)}%`} /><Stat l="What it actually buys" v={dollars(wage * real)} s={real >= 1 ? `${((real - 1) * 100).toFixed(1)}% better off` : `${((1 - real) * 100).toFixed(1)}% worse off`} /></Stats>
      <p className="text-[15.5px] text-ink-2">A pay rise only leaves you better off if it’s bigger than the rise in prices. Economists call the difference your <b className="text-ink">real wage</b>. When prices outrun pay, your dollars are worth less even though there are more of them.</p>
    </div>);
}

/* ------------------------------------------------------------------ 4. Interest rates and a mortgage */
export function MortgageRates() {
  const [loan, setLoan] = useState(600000), [rate, setRate] = useState(6.2), [term] = useState(30);
  const pay = (r: number) => { const m = r / 1200, n = term * 12; return m ? loan * m / (1 - Math.pow(1 + m, -n)) : loan / n; };
  const now = pay(rate), rows = [-1, -0.5, -0.25, 0.25, 0.5, 1];
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2"><Slider label="Loan size" value={loan} min={100000} max={2000000} step={10000} onChange={setLoan} fmt={dollars} /><Slider label="Your interest rate" value={rate} min={1} max={12} step={0.05} onChange={setRate} fmt={(v) => v.toFixed(2) + '%'} /></div>
      <Stats><Stat l="Monthly repayment" v={dollars(now)} s={`${term}-year loan, principal and interest`} /><Stat l="Interest over the loan" v={dollars(now * term * 12 - loan)} /><Stat l="Each 0.25 point rise adds" v={dollars(pay(rate + 0.25) - now)} s="a month" /></Stats>
      <table className="w-full text-[14.5px]"><thead><tr className="text-[12px] uppercase tracking-wider text-ink-3"><th className="pb-2 text-left font-semibold">If rates move by</th><th className="pb-2 text-right font-semibold">New rate</th><th className="pb-2 text-right font-semibold">Repayment</th><th className="pb-2 text-right font-semibold">Change a month</th></tr></thead><tbody>
        {rows.map((d) => { const r = Math.max(0, rate + d), p = pay(r); return <tr key={d} className="border-t border-rule"><td className="num py-1.5">{d > 0 ? '+' : '−'}{Math.abs(d).toFixed(2)} pts</td><td className="num py-1.5 text-right">{r.toFixed(2)}%</td><td className="num py-1.5 text-right">{dollars(p)}</td><td className="num py-1.5 text-right font-semibold">{p - now >= 0 ? '+' : '−'}{dollars(p - now)}</td></tr>; })}</tbody></table>
      <p className="text-[15.5px] text-ink-2">The government doesn’t set this rate. The <b className="text-ink">Reserve Bank</b>, which is independent, sets the “cash rate”, and banks move mortgage rates with it. The Bank raises rates to slow spending when inflation is too high, and cuts them when the economy needs a push.</p>
    </div>);
}
