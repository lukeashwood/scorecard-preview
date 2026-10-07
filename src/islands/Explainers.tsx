import { useMemo, useState } from 'react';
import { createModel, bn, dollars, type BudgetYear } from '../lib/budget/model';

const K = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--k5)', 'var(--k6)', 'var(--k7)'];
const Slider = ({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) => (
  <label className="grid min-w-0 gap-1 text-[14px] font-semibold text-ink-2"><span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3"><span className="min-w-0">{label}</span><span className="num font-display text-[22px] font-semibold text-ink">{fmt(value)}</span></span>
    <input type="range" className="w-full min-w-0" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={fmt(value)} /></label>);
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2"><Slider label={bal < 0 ? 'Deficit every year' : bal > 0 ? 'Surplus every year' : 'Balanced every year'} value={bal} min={-100} max={100} step={5} onChange={setBal} fmt={(v) => `$${Math.abs(v)}bn`} /><Slider label="Interest rate on the debt" value={rate} min={1} max={8} step={0.25} onChange={setRate} fmt={(v) => v.toFixed(2) + '%'} /></div>
      <Stats><Stat l="Debt today" v={`$${Math.round(debt0).toLocaleString('en-AU')}bn`} /><Stat l="Debt in 10 years" v={`$${Math.round(end.debt).toLocaleString('en-AU')}bn`} s={end.debt > debt0 ? 'higher' : end.debt < debt0 ? 'lower' : 'unchanged'} /><Stat l="Interest bill in year 10" v={`$${end.interest.toFixed(1)}bn`} s={`vs $${path[0].interest.toFixed(1)}bn today`} /></Stats>
      <div role="img" aria-label={`Debt path over ten years, from ${Math.round(debt0)} to ${Math.round(end.debt)} billion dollars`} className="flex h-[220px] items-end gap-0.5 border-b border-rule-strong sm:gap-1.5">{path.map((p) => <div key={p.y} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="num text-[9.5px] text-ink-3 sm:text-[11px]">{Math.round(p.debt)}</span><div className="w-full rounded-t-[4px]" style={{ height: `${p.debt / max * 180}px`, background: p.y === 0 ? 'var(--c4)' : 'var(--c1)', transition: 'height 220ms cubic-bezier(0.23,1,0.32,1)' }} /></div>)}</div>
      <div className="-mt-4 flex gap-1.5 text-center text-[11.5px] text-ink-3">{path.map((p) => <span key={p.y} className="flex-1">{p.y === 0 ? 'Now' : `+${p.y}`}</span>)}</div>
      <p className="text-[15.5px] text-ink-2">The <b className="text-ink">deficit</b> is the tap: how much more the government spends than it raises in one year. The <b className="text-ink">debt</b> is the bath: everything borrowed so far and not yet repaid. Turning the tap down (a smaller deficit) still fills the bath. Only a surplus lowers the level.</p>
    </div>);
}

/* ------------------------------------------------------------------ 3. Inflation and your pay */
export function InflationPay() {
  const [inf, setInf] = useState(3.5), [pay, setPay] = useState(3.2), [years, setYears] = useState(5), [wage, setWage] = useState(90000);
  const prices = Math.pow(1 + inf / 100, years), wages = Math.pow(1 + pay / 100, years), real = wages / prices;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2"><Slider label="Prices rise each year by" value={inf} min={0} max={10} step={0.1} onChange={setInf} fmt={(v) => v.toFixed(1) + '%'} /><Slider label="Your pay rises each year by" value={pay} min={0} max={10} step={0.1} onChange={setPay} fmt={(v) => v.toFixed(1) + '%'} /><Slider label="For this many years" value={years} min={1} max={20} step={1} onChange={setYears} fmt={(v) => `${v} year${v > 1 ? 's' : ''}`} /><Slider label="Your pay today" value={wage} min={30000} max={250000} step={1000} onChange={setWage} fmt={dollars} /></div>
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2"><Slider label="Loan size" value={loan} min={100000} max={2000000} step={10000} onChange={setLoan} fmt={dollars} /><Slider label="Your interest rate" value={rate} min={1} max={12} step={0.05} onChange={setRate} fmt={(v) => v.toFixed(2) + '%'} /></div>
      <Stats><Stat l="Monthly repayment" v={dollars(now)} s={`${term}-year loan, principal and interest`} /><Stat l="Interest over the loan" v={dollars(now * term * 12 - loan)} /><Stat l="Each 0.25 point rise adds" v={dollars(pay(rate + 0.25) - now)} s="a month" /></Stats>
      <table className="w-full text-[14.5px]"><thead><tr className="text-[12px] uppercase tracking-wider text-ink-3"><th className="pb-2 text-left font-semibold">If rates move by</th><th className="pb-2 text-right font-semibold">New rate</th><th className="pb-2 text-right font-semibold">Repayment</th><th className="pb-2 text-right font-semibold">Change a month</th></tr></thead><tbody>
        {rows.map((d) => { const r = Math.max(0, rate + d), p = pay(r); return <tr key={d} className="border-t border-rule"><td className="num py-1.5">{d > 0 ? '+' : '−'}{Math.abs(d).toFixed(2)} pts</td><td className="num py-1.5 text-right">{r.toFixed(2)}%</td><td className="num py-1.5 text-right">{dollars(p)}</td><td className="num py-1.5 text-right font-semibold">{p - now >= 0 ? '+' : '−'}{dollars(p - now)}</td></tr>; })}</tbody></table>
      <p className="text-[15.5px] text-ink-2">The government doesn’t set this rate. The <b className="text-ink">Reserve Bank</b>, which is independent, sets the “cash rate”, and banks move mortgage rates with it. The Bank raises rates to slow spending when inflation is too high, and cuts them when the economy needs a push.</p>
    </div>);
}

/* ------------------------------------------------------------------ 4b. Paying a mortgage off sooner */
type Run = { months: number; interest: number; path: [number, number][] };
function amortise(loan: number, rate: number, payment: number, start: number): Run {
  const m = rate / 1200; let b = Math.max(0, loan - start), interest = 0, months = 0; const path: [number, number][] = [[0, b]];
  while (b > 0.005 && months < 1200) { const i = b * m; interest += i; b = b + i - payment; months++; if (months % 6 === 0 || b <= 0) path.push([months, Math.max(0, b)]); }
  return { months, interest, path };
}
const yrsMonths = (n: number) => { const y = Math.floor(n / 12), mo = n % 12; return `${y} year${y === 1 ? '' : 's'}${mo ? ` ${mo} month${mo === 1 ? '' : 's'}` : ''}`; };

export function PayOffSooner() {
  const [loan, setLoan] = useState(600000), [rate, setRate] = useState(6.2), [extra, setExtra] = useState(200), [lump, setLump] = useState(0);
  const term = 30, m = rate / 1200, n = term * 12;
  const pay = m ? loan * m / (1 - Math.pow(1 + m, -n)) : loan / n;
  const base = useMemo(() => amortise(loan, rate, pay, 0), [loan, rate, pay]);
  const fast = useMemo(() => amortise(loan, rate, pay + extra, lump), [loan, rate, pay, extra, lump]);
  const saved = base.interest - fast.interest, sooner = base.months - fast.months;
  // Balance over time: the standard loan beside the one with extra payments.
  const W = 600, H = 200, px = (yrs: number) => (yrs / term) * W, py = (v: number) => H - (v / loan) * H;
  const line = (p: [number, number][]) => p.map(([mo, v], i) => `${i ? 'L' : 'M'}${px(Math.min(mo / 12, term)).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
        <Slider label="Loan size" value={loan} min={100000} max={2000000} step={10000} onChange={setLoan} fmt={dollars} />
        <Slider label="Your interest rate" value={rate} min={1} max={12} step={0.05} onChange={setRate} fmt={(v) => v.toFixed(2) + '%'} />
        <Slider label="Extra each month" value={extra} min={0} max={3000} step={50} onChange={setExtra} fmt={dollars} />
        <Slider label="One-off lump sum, paid now" value={lump} min={0} max={Math.min(300000, loan)} step={5000} onChange={setLump} fmt={dollars} />
      </div>
      <Stats>
        <Stat l="Interest saved" v={dollars(Math.max(0, saved))} s={`${dollars(fast.interest)} instead of ${dollars(base.interest)}`} />
        <Stat l="Paid off sooner by" v={sooner > 0 ? yrsMonths(sooner) : 'No change'} s={`loan cleared in ${yrsMonths(fast.months)}`} />
        <Stat l="Monthly repayment" v={dollars(pay + extra)} s={extra ? `${dollars(pay)} required plus ${dollars(extra)} extra` : 'the required amount'} />
      </Stats>
      <figure className="m-0">
        <svg viewBox={`0 0 ${W} ${H + 24}`} className="block w-full" role="img" aria-label={`Loan balance over ${term} years: the standard loan is cleared in ${term} years; with the extra payments it is cleared in ${yrsMonths(fast.months)}.`}>
          {[0, 10, 20, 30].map((y) => <g key={y}><line x1={px(y)} x2={px(y)} y1={0} y2={H} stroke="var(--grid)" /><text x={px(y)} y={H + 18} textAnchor={y === 0 ? 'start' : y === term ? 'end' : 'middle'} fontSize="12" fill="var(--ink-3)">{y === 0 ? 'Now' : `${y} yrs`}</text></g>)}
          <line x1={0} x2={W} y1={H} y2={H} stroke="var(--ink-3)" />
          <path d={line(base.path)} fill="none" stroke="var(--c4)" strokeWidth={2.5} strokeDasharray="6 5" />
          <path d={line(fast.path)} fill="none" stroke="var(--c1)" strokeWidth={3} />
        </svg>
        <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-ink-2">
          <span className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[3px] w-5 rounded" style={{ background: 'var(--c4)' }} />Standard loan: what you still owe</span>
          <span className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-[3px] w-5 rounded" style={{ background: 'var(--c1)' }} />With your extra payments</span>
        </figcaption>
      </figure>
      <p className="text-[15.5px] text-ink-2">Every extra dollar goes straight off what you owe, so less interest is charged on it every month from then on. That is why money paid early saves far more than the same amount paid late in the loan. Money in an offset account works the same way. Check your loan’s rules first: some fixed-rate loans limit or charge for extra repayments.</p>
    </div>);
}
