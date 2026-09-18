import { useState } from 'react';
import { Donut } from './BudgetBuilder';
import { bn, pctOf } from '../lib/budget/model';

interface Line { name: string; value_m: number; detail: [string, number][] }
interface Year { year: string; label: string; type: string; document: string; url: string; published?: string; revenue: Line[]; expenses: Line[]; revenue_total_m: number; expenses_total_m: number; ucb_m: number; gross_debt_bn: number; gdp_m?: number }

export default function BudgetExplorer({ years }: { years: Year[] }) {
  const [i, setI] = useState(0); const Y = years[i];
  const stats = [
    { l: 'Revenue', v: bn(Y.revenue_total_m), s: Y.gdp_m ? `${pctOf(Y.revenue_total_m, Y.gdp_m)} of GDP` : 'accrual basis' },
    { l: 'Spending', v: bn(Y.expenses_total_m), s: Y.gdp_m ? `${pctOf(Y.expenses_total_m, Y.gdp_m)} of GDP` : 'accrual basis' },
    { l: Y.ucb_m < 0 ? 'Deficit' : 'Surplus', v: bn(Math.abs(Y.ucb_m)), s: 'underlying cash balance, the headline measure' },
    { l: 'Gross debt', v: bn(Y.gross_debt_bn * 1000, 0), s: 'at 30 June' },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">{Y.type}</p><p className="font-display text-[26px] font-semibold">{Y.year}</p><p className="meta">{Y.document} · <a href={Y.url} rel="noopener">source</a></p></div>
        <div role="group" aria-label="Choose a year" className="flex gap-1 rounded-xl bg-panel p-1">{years.map((y, k) => <button key={y.year} type="button" aria-pressed={i === k} onClick={() => setI(k)} className="btn btn-sm" style={i === k ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--shadow)' } : { color: 'var(--ink-2)' }}>{y.label}</button>)}</div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-rule bg-rule md:grid-cols-4">{stats.map((x) => <div key={x.l} className="bg-surface px-4 py-4"><dt className="eyebrow">{x.l}</dt><dd className="num font-display text-[30px] font-semibold leading-tight">{x.v}</dd><dd className="meta">{x.s}</dd></div>)}</dl>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Donut title="Where the money comes from" names={Y.revenue.map((l) => l.name)} values={Y.revenue.map((l) => l.value_m)} />
        <Donut title="Where the money goes" names={Y.expenses.map((l) => l.name)} values={Y.expenses.map((l) => l.value_m)} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">{([['Revenue, line by line', Y.revenue], ['Spending, line by line', Y.expenses]] as [string, Line[]][]).map(([t, lines]) => (
        <section key={t} className="card card-pad"><h3 className="h3">{t}</h3><p className="meta">Exactly as published. Open a category to see what’s inside it.</p>
          {lines.map((l) => <details key={l.name} className="rule-t mt-2 pt-2"><summary className="flex cursor-pointer items-baseline justify-between gap-3 py-1 text-[15px] font-semibold"><span>{l.name}</span><span className="num">{bn(l.value_m)}</span></summary>
            <table className="mb-2 mt-1 w-full text-[13.5px] text-ink-2"><tbody>{l.detail.map(([n, v]) => <tr key={n} className="border-t border-rule"><td className="py-1 pr-3">{n}</td><td className="num py-1 text-right">{bn(v, 2)}</td></tr>)}</tbody></table></details>)}
        </section>))}</div>
    </div>);
}
