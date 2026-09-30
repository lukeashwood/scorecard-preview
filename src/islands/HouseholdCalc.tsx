import { useMemo, useState } from 'react';
import { incomeTax, type TaxRules } from '../lib/personalTax';

/* "Are you better or worse off?" A household calculator. It compares what your household takes home now with what the
   same jobs paid after tax in the base year (2022-23, the first year of this government), with the old figure lifted to today's
   prices. Optional: a mortgage (interest is left out of the CPI) or rent (renters spend far more of their income on it
   than the CPI's average household). Both are compared in today's prices, like everything else. Runs in the browser. */

interface Props {
  then: TaxRules; now: TaxRules;
  cpi: number; wpi: number; periodLabel: string;
  mortgage: { then: number; now: number; thenLabel: string; nowLabel: string } | null;
  /** CPI rents, % change over the same period. */
  rentGrowth?: number;
}

const repay = (loan: number, rate: number) => { const i = rate / 1200, n = 360; return i ? loan * i / (1 - Math.pow(1 + i, -n)) : loan / n; };
const $ = (v: number) => (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-AU');
const signed$ = (v: number) => (v > 0 ? '+' : '') + $(v);
const num = (s: string) => { const v = Number(String(s).replace(/[^0-9.]/g, '')); return Number.isFinite(v) ? v : 0; };

function Money({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label htmlFor={id} className="grid gap-1 text-[14px] font-semibold">
      {label}
      <span className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span>
        <input id={id} inputMode="numeric" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0"
          className="num w-full rounded-lg border border-rule-strong bg-surface py-2.5 pl-7 pr-3 text-[16px] font-semibold focus:border-brand focus:outline-none" /></span>
      {hint && <span className="meta font-normal">{hint}</span>}
    </label>
  );
}

export default function HouseholdCalc({ then, now, cpi, wpi, periodLabel, mortgage, rentGrowth }: Props) {
  const [a, setA] = useState('90,000');
  const [b, setB] = useState('');
  const [aThen, setAThen] = useState('');
  const [bThen, setBThen] = useState('');
  const [loan, setLoan] = useState('');
  const [tenure, setTenure] = useState<'none' | 'mortgage' | 'rent'>('none');
  const [rent, setRent] = useState('');
  const [more, setMore] = useState(false);
  const [dropLmito, setDropLmito] = useState(false);
  const cpiR = 1 + cpi / 100, wpiR = 1 + wpi / 100;

  const r = useMemo(() => {
    const people = [[num(a), num(aThen)], [num(b), num(bThen)]].filter(([n]) => n > 0).map(([nowInc, thenInc]) => {
      const inc0 = thenInc > 0 ? thenInc : nowInc / wpiR;
      const tax0 = incomeTax(inc0, then, dropLmito), tax1 = incomeTax(nowInc, now);
      return { nowInc, inc0, tax0, tax1, pay: nowInc - inc0 * cpiR, tax: -(tax1 - tax0 * cpiR), estimated: !(thenInc > 0) };
    });
    const pay = people.reduce((s, p) => s + p.pay, 0), tax = people.reduce((s, p) => s + p.tax, 0);
    // Same loan both times; the 2022 repayment is lifted to today's prices, like the 2022 pay it came out of.
    const L = tenure === 'mortgage' ? num(loan) : 0; const mort = mortgage && L > 0 ? -12 * (repay(L, mortgage.now) - repay(L, mortgage.then) * cpiR) : 0;
    // Rent: today's rent against the same home's rent in 2022 (CPI rents), with the 2022 rent lifted to today's prices.
    const R = tenure === 'rent' && rentGrowth != null ? num(rent) : 0; const rentCost = R > 0 ? -52 * (R - (R / (1 + rentGrowth! / 100)) * cpiR) : 0;
    const takeNow = people.reduce((s, p) => s + p.nowInc - p.tax1, 0), takeThen = people.reduce((s, p) => s + (p.inc0 - p.tax0) * cpiR, 0);
    return { people, pay, tax, mort, rentCost, total: pay + tax + mort + rentCost, takeNow, takeThen };
  }, [a, b, aThen, bThen, loan, rent, tenure, dropLmito, then, now, cpiR, wpiR, mortgage, rentGrowth]);

  const has = r.people.length > 0;
  const better = r.total >= 0;
  return (
    <div className="card overflow-hidden shadow-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-4 border-b border-rule p-5 md:p-7 lg:border-b-0 lg:border-r">
          <div>
            <p className="eyebrow">Your household</p>
            <h3 className="mt-1 font-display text-[24px] font-semibold leading-tight">Are you better or worse off?</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">Enter what you earn now, before tax. We compare it with what the same pay was worth after tax in {then.label}, in today’s dollars.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Money id="hc-a" label="Your income now (a year)" value={a} onChange={setA} />
            <Money id="hc-b" label="Partner’s income now" value={b} onChange={setB} hint="Leave blank if single" />
          </div>
          <fieldset className="grid gap-2"><legend className="text-[14px] font-semibold">Your home</legend>
            <div className="flex flex-wrap gap-1.5" role="group">{([['none', 'Leave out'], ['mortgage', 'Mortgage'], ['rent', 'Renting']] as const).filter(([k]) => k !== 'mortgage' || mortgage).filter(([k]) => k !== 'rent' || rentGrowth != null).map(([k, l]) => (
              <button key={k} type="button" className="btn btn-sm btn-ghost" aria-pressed={tenure === k} onClick={() => setTenure(k)} style={tenure === k ? { background: 'var(--ink)', color: 'var(--paper)' } : undefined}>{l}</button>))}</div>
          </fieldset>
          {tenure === 'mortgage' && mortgage && <Money id="hc-l" label="Mortgage owing" value={loan} onChange={setLoan} hint={`Variable rate ${mortgage.thenLabel} ${mortgage.then.toFixed(2)}%, now ${mortgage.now.toFixed(2)}% (${mortgage.nowLabel})`} />}
          {tenure === 'rent' && rentGrowth != null && <Money id="hc-r" label="Rent now, a week" value={rent} onChange={setRent} hint={`Rents are up ${rentGrowth.toFixed(1)}% since ${periodLabel.split(' → ')[0]} (CPI rents). New leases have risen faster than that.`} />}
          <button type="button" className="justify-self-start text-[14px] font-semibold text-brand underline" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Hide' : 'More options'}</button>
          {more && <div className="grid gap-4 rounded-lg bg-panel p-4">
            <p className="text-[14px] text-ink-2">If you know what you earned in {then.label}, enter it. Otherwise we assume your pay rose in line with average wages ({wpi.toFixed(1)}%).</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Money id="hc-a0" label={`Your income in ${then.label}`} value={aThen} onChange={setAThen} />
              <Money id="hc-b0" label={`Partner’s income in ${then.label}`} value={bThen} onChange={setBThen} />
            </div>
            {then.lmito && <label className="flex items-start gap-2 text-[14px]"><input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand)]" checked={dropLmito} onChange={(e) => setDropLmito(e.target.checked)} />
              <span>Leave out the 2021-22 low and middle income tax offset. <span className="text-ink-3">It was a temporary offset (up to $1,500) that the previous government legislated to end in June 2022. Tick this to compare against the ongoing tax rates only.</span></span></label>}
          </div>}
        </div>

        <div className="p-5 md:p-7" aria-live="polite">
          {!has ? <p className="text-ink-2">Enter an income to see the result.</p> : <>
            <p className="eyebrow">{better ? 'Better off' : 'Worse off'} than in {then.label}</p>
            <p className={`num mt-1 font-display text-[clamp(40px,6vw,56px)] font-semibold leading-none tracking-tight ${better ? 'text-good' : 'text-bad'}`}>{$(Math.abs(r.total))}<span className="text-[0.4em] font-semibold text-ink-2"> a year</span></p>
            <p className="meta mt-2">About {$(Math.abs(r.total) / 52)} a week {better ? 'better' : 'worse'} off, in today’s dollars.</p>
            <dl className="mt-5 grid gap-0 text-[15px]">
              {[
                { l: 'Pay compared with prices', v: r.pay, n: `Prices are up ${cpi.toFixed(1)}% since ${periodLabel.split(' → ')[0]}.` },
                { l: 'Income tax and Medicare levy', v: r.tax, n: `${now.label} rates compared with ${then.label}.` },
                ...(r.mort ? [{ l: 'Mortgage repayments', v: r.mort, n: 'Same loan, 30 year term, compared in today’s prices. Interest is not counted in the CPI.' }] : []),
                ...(r.rentCost ? [{ l: 'Rent', v: r.rentCost, n: `Rent up ${rentGrowth!.toFixed(1)}% against prices up ${cpi.toFixed(1)}%, on the rent you pay now.` }] : []),
              ].map((x) => (
                <div key={x.l} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 border-t border-rule py-2.5">
                  <dt className="font-semibold">{x.l}</dt><dd className={`num font-bold ${x.v >= 0 ? 'text-good' : 'text-bad'}`}>{signed$(x.v)}</dd>
                  <span className="meta col-span-2">{x.n}</span>
                </div>))}
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 border-t-2 border-ink py-2.5"><dt className="font-bold">Total a year</dt><dd className={`num font-bold ${better ? 'text-good' : 'text-bad'}`}>{signed$(r.total)}</dd></div>
            </dl>
            <p className="meta mt-3">Take-home pay now {$(r.takeNow)} a year, against {$(r.takeThen)} for the same {r.people.length > 1 ? 'jobs' : 'job'} in {then.label} (in today’s dollars).{r.people.some((p) => p.estimated) ? ` ${then.label} pay estimated from average wage growth of ${wpi.toFixed(1)}%.` : ''}</p>
          </>}
          <p className="meta mt-4 border-t border-rule pt-3">How it works: official Consumer Price Index and Wage Price Index, {periodLabel}; ATO resident tax rates, low income tax offset and Medicare levy for each year. Leaves out HELP repayments, super, government payments, rebates and other offsets. A guide, not financial advice.</p>
        </div>
      </div>
    </div>
  );
}
