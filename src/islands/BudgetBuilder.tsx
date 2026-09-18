import { useEffect, useMemo, useRef, useState } from 'react';
import { arc as d3arc, pie as d3pie } from 'd3-shape';
import { createModel, bn, pctOf, dollars, cloneRates, type BudgetYear, type Kind, type Mode, type Rates, type State } from '../lib/budget/model';

interface Migration {
  year: string; nom_forecast: number; nom_note: string; nom_url: string; split_note: string;
  components: { id: string; name: string; sub?: string; value: number; fixed?: boolean; note?: string }[];
  program: { id: string; name: string; places: number; value: number; welfare?: { jobseeker_pct: number; by_years: number[]; same_transfers: number } }[];
  temp_values: { name: string; value: number }[];
  rules: { gdp_pct_per_100k: number; pbo_step: number; pbo_up_m: number; pbo_down_m: number; pbo_max: number; pbo_period: string; rent_step: number; rent_pct: number; persons_per_home: number; completions: number; completions_year: number };
  welfare?: { population_pct: number; note: string; url: string; source: string };
  evidence: { key: string; short: string; topic: string; source: string; url: string; finding: string }[];
}
const K = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--k5)', 'var(--k6)', 'var(--k7)'];
const MODES: { id: Mode; label: string; help: string }[] = [
  { id: 'deficit', label: 'Borrow the difference', help: 'Nothing else moves. Extra spending or lower taxes add to the deficit, which is borrowed.' },
  { id: 'spending', label: 'Change other spending', help: 'Other spending moves the opposite way, in the Budget’s proportions, so the bottom line stays put. Interest can’t be cut by choice.' },
  { id: 'taxes', label: 'Change other taxes', help: 'Taxes move to cover it, in the Budget’s proportions, so the bottom line stays put.' },
];
const n0 = (v: number) => Math.round(v).toLocaleString('en-AU');
const sgn = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + n0(Math.abs(v));

/** A number box that lets you type freely and only commits sensible values. */
function Num({ value, onCommit, step = 1, min = 0, max, label, id, width = 96, disabled }: { value: number; onCommit: (v: number) => void; step?: number; min?: number; max?: number; label: string; id?: string; width?: number; disabled?: boolean }) {
  const [txt, setTxt] = useState<string | null>(null);
  return <input id={id} className="input !min-h-[38px] !px-2 text-[15px]" style={{ width }} type="number" inputMode="decimal" aria-label={label} step={step} min={min} max={max} disabled={disabled}
    value={txt ?? String(value)} onFocus={(e) => { setTxt(String(value)); e.currentTarget.select(); }} onBlur={() => setTxt(null)}
    onChange={(e) => { setTxt(e.target.value); const v = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(v)) onCommit(v); }} />;
}

export default function BudgetBuilder({ year, migration }: { year: BudgetYear; migration?: Migration | null }) {
  const M = useMemo(() => createModel(year), [year]);
  const [state, setState] = useState<State>(() => M.initial());
  const [mode, setMode] = useState<Mode>('deficit');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'lines' | 'rates' | 'migration'>('lines');
  const [shared, setShared] = useState<State | null>(null);
  const [copied, setCopied] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const live = useRef<HTMLParagraphElement>(null);

  useEffect(() => { const s = M.decode(location.hash); if (s) setShared(s); }, [M]);
  const S = M.summary(state);
  const apply = (r: { state: State; note: string }) => { setState(r.state); setNote(r.note); };
  const set = (k: Kind, i: number, v: number) => apply(M.setLine(state, k, i, v, mode));
  const resetLine = (k: Kind, i: number) => {
    let s = state;
    if (s.rates && M.baseRates && k === 'revenue' && i === M.I.pit) s = { ...s, rates: { ...cloneRates(s.rates), br: cloneRates(M.baseRates).br, ml: M.baseRates.ml, split: 0 } };
    if (s.rates && M.baseRates && k === 'revenue' && i === M.I.gst) s = { ...s, rates: { ...cloneRates(s.rates), gst: M.baseRates.gst } };
    apply(M.setLine(s, k, i, M.base[k][i], mode));
  };
  const share = async () => {
    const link = location.href.split('#')[0] + '#' + encodeURIComponent(M.encode(state));
    try { await navigator.clipboard.writeText(link); setCopied('Link copied'); } catch { setCopied('Couldn’t copy. Your browser blocked it.'); }
    setTimeout(() => setCopied(''), 2400);
  };
  const dirty = S.changed || JSON.stringify(state.rates) !== JSON.stringify(M.baseRates);

  const impact: string[] = [];
  impact.push(S.balanced ? 'Your budget <b>balances</b>: revenue covers spending.' : `Your budget has a <b>${S.bal > 0 ? 'surplus' : 'deficit'} of ${bn(Math.abs(S.bal))}</b> (${pctOf(Math.abs(S.bal), M.GDP)} of GDP). The government’s Budget has a ${S.baseBal < 0 ? 'deficit' : 'surplus'} of ${bn(Math.abs(S.baseBal))} on the same measure.`);
  if (S.changed) {
    impact.push(`That is <b>${bn(Math.abs(S.dBal))} a year ${S.dBal > 0 ? 'better' : 'worse'}</b> than the Budget${S.perPerson != null ? `, about <b>${dollars(S.perPerson)} for every Australian</b> each year` : ''}.`);
    impact.push(S.debtCleared ? 'A surplus this large would pay off all gross debt within the year, which shows how far from reality this setting is.' : `Gross debt would be roughly <b>${bn(S.debt, 0)}</b> (${pctOf(S.debt, M.GDP)} of GDP) instead of ${bn(S.debt0, 0)}.`);
    if (!S.debtCleared) impact.push(S.dBal < 0 ? `At the average interest rate the Budget implies (about ${(S.rate * 100).toFixed(1)}%), the extra borrowing adds about <b>${bn(S.interestDelta, 2)} a year in interest</b>, every year, until it’s repaid.` : `Borrowing ${bn(S.dBal)} less saves about <b>${bn(-S.interestDelta, 2)} a year in interest</b> at the average rate the Budget implies (about ${(S.rate * 100).toFixed(1)}%).`);
  }
  if (S.bal < -50) {
    const a = S.pitRise == null ? 'there is no income tax left to raise' : S.pitRise > 100 ? 'income tax would have to <b>more than double</b>' : `income tax would have to rise by <b>${S.pitRise.toFixed(1)}%</b>`;
    const b = S.spendCut == null ? 'there is no spending left to cut' : S.spendCut > 100 ? 'cutting <b>all</b> spending other than interest still wouldn’t be enough' : `all spending other than interest would have to fall by <b>${S.spendCut.toFixed(1)}%</b>`;
    impact.push(`To balance it: ${a}, or ${b}, or a mix of the two.`);
  }
  if (S.defencePct != null) impact.push(`Defence funding would be <b>${S.defencePct.toFixed(2)}% of GDP</b> (Budget: ${S.baseDefencePct!.toFixed(2)}%).`);
  if (S.spendPerDollar != null) impact.push(`For every $1 it raises, your government spends <b>$${S.spendPerDollar.toFixed(2)}</b> (Budget: $${S.baseSpendPerDollar.toFixed(2)}).`);

  return (
    <div>
      {shared && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-brand-tint p-4">
          <p className="flex-1 text-[15px]">You opened a link to someone’s budget. You’re looking at the government’s Budget for now.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setState(shared); setShared(null); setNote('Loaded the budget from the link.'); }}>Load their budget</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShared(null)}>Dismiss</button>
        </div>
      )}

      {/* summary: sticky so the bottom line is always in view while you move a slider */}
      <div className="sticky top-[64px] z-20 -mx-1 bg-paper/95 px-1 py-3 backdrop-blur">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-rule bg-rule md:grid-cols-4">
          {[
            { l: 'Revenue', v: bn(S.rev), s: `${pctOf(S.rev, M.GDP)} of GDP`, c: '' },
            { l: 'Spending', v: bn(S.exp), s: `${pctOf(S.exp, M.GDP)} of GDP`, c: '' },
            { l: S.balanced ? 'Balanced' : S.bal > 0 ? 'Surplus' : 'Deficit', v: S.balanced ? '$0bn' : bn(Math.abs(S.bal)), s: `${pctOf(Math.abs(S.bal), M.GDP)} of GDP`, c: S.balanced || S.bal > 0 ? 'text-good' : 'text-bad' },
            { l: 'Against the Budget', v: S.changed ? (S.dBal > 0 ? '+' : '−') + bn(Math.abs(S.dBal)) : 'No change', s: S.changed ? (S.dBal > 0 ? 'better bottom line' : 'worse bottom line') : 'same bottom line', c: S.changed ? (S.dBal > 0 ? 'text-good' : 'text-bad') : '' },
          ].map((x) => <div key={x.l} className="bg-surface px-4 py-3"><dt className="eyebrow">{x.l}</dt><dd className={`num font-display text-[clamp(22px,2.6vw,30px)] font-semibold leading-tight ${x.c}`}>{x.v}</dd><dd className="meta">{x.s}</dd></div>)}
        </dl>
        <p ref={live} role="status" className="min-h-[22px] pt-1.5 text-[14px] text-ink-2">{note}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div role="tablist" aria-label="What to change" className="flex gap-1 rounded-xl bg-panel p-1">
          {([['lines', 'Tax and spending lines'], ['rates', 'Tax rates'], ...(migration ? [['migration', 'Migration']] : [])] as [typeof tab, string][]).map(([id, l]) => (
            <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className="btn btn-sm" style={tab === id ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--shadow)' } : { color: 'var(--ink-2)' }}>{l}</button>))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={share}>{copied || 'Copy link to my budget'}</button>
          {confirmReset
            ? <span className="inline-flex items-center gap-2 text-[14px]">Undo all your changes? <button type="button" className="btn btn-primary btn-sm" onClick={() => { setState(M.initial()); setNote('Back to the government’s Budget.'); setConfirmReset(false); }}>Yes, start again</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Keep them</button></span>
            : <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty} onClick={() => setConfirmReset(true)}>Start again</button>}
        </div>
      </div>

      {tab === 'lines' && (
        <div className="mt-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <fieldset><legend className="text-[14px] font-bold">When I change a line, pay for it by:</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">{MODES.map((m) => <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className="btn btn-sm btn-ghost" style={mode === m.id ? { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' } : undefined}>{m.label}</button>)}</div>
              <p className="meta mt-2 max-w-[60ch]">{MODES.find((m) => m.id === mode)!.help}</p></fieldset>
            <div><p className="text-[14px] font-bold">Try an example:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{([['defence', 'Defence at 3.5% of GDP'], ['pit', 'Income tax 10% lower'], ['cuts', 'Balance it with spending cuts'], ['taxes', 'Balance it with tax rises']] as const).map(([id, l]) => <button key={id} type="button" className="btn btn-sm btn-quiet" onClick={() => apply(M.preset(state, id, mode))}>{l}</button>)}</div></div>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {(['revenue', 'expenses'] as Kind[]).map((k) => (
              <section key={k} className="card card-pad" aria-label={k === 'revenue' ? 'Revenue' : 'Spending'}>
                <h3 className="h3">{k === 'revenue' ? 'Revenue: what comes in' : 'Spending: what goes out'}</h3>
                {M.names[k].map((name, i) => { const v = state[k][i], b0 = M.base[k][i], d = v - b0, locked = k === 'expenses' && i === M.I.interest; return (
                  <div key={name} className="rule-t mt-4 pt-4 first-of-type:mt-3 first-of-type:border-t-0 first-of-type:pt-0">
                    <div className="flex items-baseline justify-between gap-2"><label htmlFor={`${k}-${i}`} className="flex items-center gap-2 font-bold"><span aria-hidden className="inline-block h-3 w-3 rounded-[3px]" style={{ background: K[i % K.length] }} />{name}</label><span className="meta num">{pctOf(v, k === 'revenue' ? S.rev : S.exp)} of {k === 'revenue' ? 'revenue' : 'spending'}</span></div>
                    <input id={`${k}-${i}`} type="range" min={0} max={M.cap(k, i)} step={Math.max(50, Math.round(b0 / 400))} value={v} onChange={(e) => set(k, i, Number(e.target.value))} aria-valuetext={`${bn(v)}, ${pctOf(v, M.GDP, 2)} of GDP`} />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold text-ink-2">
                      <span className="inline-flex items-center gap-1.5">$bn <Num label={`${name}, $ billion`} value={Number((v / 1000).toFixed(1))} step={0.5} onCommit={(x) => set(k, i, x * 1000)} /></span>
                      <span className="inline-flex items-center gap-1.5">% of GDP <Num label={`${name}, % of GDP`} value={Number((v / M.GDP * 100).toFixed(2))} step={0.05} onCommit={(x) => set(k, i, x / 100 * M.GDP)} /></span>
                      <span className={`num ${Math.abs(d) < 50 ? 'text-ink-3' : 'text-ink'}`}>{Math.abs(d) < 50 ? 'As in the Budget' : `${d > 0 ? '+' : '−'}${bn(Math.abs(d))} (${d > 0 ? '+' : '−'}${Math.abs(d / (b0 || 1) * 100).toFixed(0)}%)`}</span>
                      {Math.abs(d) >= 50 && <button type="button" className="ml-auto font-bold text-brand underline-offset-2 hover:underline" onClick={() => resetLine(k, i)}>Reset</button>}
                    </div>
                    {locked && <p className="meta mt-2 rounded-lg bg-panel p-2.5">Interest is set by the debt already owed and by interest rates, not by a decision. You can move it to see its weight, but “pay for it” never touches it.</p>}
                    {k === 'revenue' && i === M.I.gst && <p className="meta mt-2 rounded-lg bg-panel p-2.5">GST is collected by Canberra and handed to the states, so it also sits inside “Payments to states”. Changing it here doesn’t change that line.</p>}
                  </div>); })}
              </section>))}
          </div>
        </div>
      )}

      {tab === 'rates' && <RatesPanel M={M} state={state} mode={mode} apply={apply} />}
      {tab === 'migration' && migration && <MigrationPanel MG={migration} GDP={M.GDP} />}

      {tab !== 'migration' && (<>
        <section className="card card-pad mt-6"><h3 className="h3">What your budget means</h3><ul className="mt-3 grid list-disc gap-2 pl-5 text-[15.5px]">{impact.map((t, i) => <li key={i} dangerouslySetInnerHTML={{ __html: t }} />)}</ul></section>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Donut title="Your revenue" names={M.names.revenue} values={state.revenue} />
          <Donut title="Your spending" names={M.names.expenses} values={state.expenses} />
        </div></>)}
    </div>
  );
}

/* ------------------------------------------------------------------ donut: slices follow the entity, never the rank */
export function Donut({ title, names, values }: { title: string; names: string[]; values: number[] }) {
  const total = values.reduce((a, b) => a + b, 0); const [hot, setHot] = useState<number | null>(null);
  const arcs = d3pie<number>().sort(null).padAngle(0.012)(values.map((v) => Math.max(0, v))); const gen = d3arc<any>().innerRadius(58).outerRadius(96).cornerRadius(2);
  return (
    <section className="card card-pad"><h3 className="h3">{title}</h3>
      <div className="mt-3 grid items-center gap-5 sm:grid-cols-[210px_1fr]">
        <svg viewBox="-100 -100 200 200" width="210" height="210" role="img" aria-label={`${title}: ${names.map((n, i) => `${n} ${pctOf(values[i], total)}`).join(', ')}`} className="mx-auto">
          {total > 0 ? arcs.map((a, i) => <path key={i} d={gen(a) ?? ''} fill={K[i % K.length]} opacity={hot == null || hot === i ? 1 : 0.35} onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)} />) : <circle r="77" fill="none" stroke="var(--rule)" strokeWidth="38" />}
          <text textAnchor="middle" y="-2" fontSize="20" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)">{hot == null ? bn(total, 0) : pctOf(values[hot], total)}</text>
          <text textAnchor="middle" y="16" fontSize="9.5" fill="var(--ink-3)">{hot == null ? 'total' : names[hot].slice(0, 24)}</text>
        </svg>
        <table className="w-full text-[13.5px]"><tbody>{names.map((n, i) => <tr key={n} className="border-b border-rule last:border-0" onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)} style={{ background: hot === i ? 'var(--panel)' : undefined }}>
          <td className="py-1.5 pr-2"><span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: K[i % K.length] }} />{n}</td><td className="num py-1.5 pr-2 text-right font-semibold">{bn(values[i])}</td><td className="num py-1.5 text-right text-ink-3">{pctOf(values[i], total)}</td></tr>)}</tbody></table>
      </div></section>);
}

/* ------------------------------------------------------------------ tax rates */
function RatesPanel({ M, state, mode, apply }: { M: ReturnType<typeof createModel>; state: State; mode: Mode; apply: (r: { state: State; note: string }) => void }) {
  const [a, setA] = useState(150000), [b, setB] = useState(0);
  if (!M.taxOK || !state.rates || !M.baseRates) return <p className="card card-pad mt-5 text-ink-2">Tax-rate data isn’t available for this Budget year, so this section is switched off. The tax and spending lines still work.</p>;
  const t = state.rates, TX = M.TX!;
  const change = (f: (r: Rates) => void) => { const r = cloneRates(t); f(r); if (M.validRates(r)) apply(M.applyRates(state, r, mode)); else apply({ state, note: 'That setting isn’t possible: each bracket must start above the one before it, rates run from 0 to 100%, GST from 0 to 50% and the Medicare levy from 0 to 10%.' }); };
  const isBase = JSON.stringify(t) === JSON.stringify(M.baseRates);
  const costAll = M.splitCostAll(t), costKids = costAll * M.KIDS_SHARE;
  const sep = M.personTax(a, t) + M.personTax(b, t), spl = 2 * M.personTax((a + b) / 2, t), gain = Math.max(0, sep - spl);
  const drift = Math.abs(state.revenue[M.I.pit] - M.pitFromRates(t)) > 50 || Math.abs(state.revenue[M.I.gst] - M.gstFromRates(t)) > 50;
  return (
    <div className="mt-5 grid gap-5">
      <section className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="h3">Personal income tax, Medicare levy and GST</h3><p className="meta mt-1 max-w-[70ch]">Change the rates themselves and the revenue lines follow. Costed on the ATO’s count of {(TX.distribution.bands.reduce((x, y) => x + y[2], 0) / 1e6).toFixed(1)} million taxpayers by income (<a href={TX.distribution.url}>{TX.distribution.income_year} tax statistics</a>), with incomes grown to {TX.income_year} by wage growth. It assumes nobody changes how much they earn in response.</p></div>
          {!isBase && <button type="button" className="btn btn-ghost btn-sm" onClick={() => apply(M.applyRates(state, cloneRates(M.baseRates!), mode))}>Put rates back to the Budget</button>}</div>
        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <div><div className="table-scroll"><table className="w-full text-[14.5px]"><thead><tr className="text-left text-[12px] uppercase tracking-wider text-ink-3"><th className="pb-2 font-semibold">Income over</th><th className="pb-2 font-semibold">up to</th><th className="pb-2 font-semibold">Rate</th></tr></thead><tbody>
            {t.br.map((br, k) => { const b0 = M.baseRates!.br[k], same = b0[0] === br[0] && b0[1] === br[1]; return <tr key={k} className="border-t border-rule"><td className="py-2 pr-2"><span className="inline-flex items-center gap-1">$<Num label={`Bracket ${k + 1} starts above`} value={br[0]} step={1000} width={104} disabled={k === 0} onCommit={(v) => change((r) => { r.br[k][0] = Math.round(v); })} /></span></td><td className="num py-2 pr-2 text-ink-3">{t.br[k + 1] ? dollars(t.br[k + 1][0]) : 'no limit'}</td><td className="py-2"><span className="inline-flex items-center gap-1"><Num label={`Bracket ${k + 1} rate, per cent`} value={br[1]} step={0.5} max={100} width={70} onCommit={(v) => change((r) => { r.br[k][1] = v; })} />%</span>{!same && <span className="meta ml-2">was {k ? dollars(b0[0]) + ', ' : ''}{b0[1]}%</span>}</td></tr>; })}</tbody></table></div>
            <div className="mt-4 flex flex-wrap gap-5 text-[13.5px] font-semibold text-ink-2"><span className="inline-flex items-center gap-2">Medicare levy % <Num label="Medicare levy, per cent" value={t.ml} step={0.1} max={10} width={70} onCommit={(v) => change((r) => { r.ml = v; })} /></span><span className="inline-flex items-center gap-2">GST % <Num label="GST rate, per cent" value={t.gst} step={0.5} max={50} width={70} onCommit={(v) => change((r) => { r.gst = v; })} /></span></div>
            {drift && <p className="meta mt-3 rounded-lg bg-panel p-2.5">You’ve also moved income tax or GST directly (or an example did), so those dollar lines no longer come only from these rates. Changing a rate resets them to what the rates raise.</p>}</div>
          <div><h4 className="text-[14px] font-bold">Tax on one person’s income</h4><div className="table-scroll mt-2"><table className="w-full text-[14px]"><thead><tr className="text-[12px] uppercase tracking-wider text-ink-3"><th className="pb-2 text-left font-semibold">Taxable income</th><th className="pb-2 text-right font-semibold">Budget</th><th className="pb-2 text-right font-semibold">Yours</th><th className="pb-2 text-right font-semibold">Difference</th></tr></thead><tbody>
            {[30000, 50000, 75000, 100000, 150000, 200000, 300000].map((x) => { const p = M.personTax(x, M.baseRates!), q = M.personTax(x, t), d = q - p; return <tr key={x} className="border-t border-rule"><td className="num py-1.5">{dollars(x)}</td><td className="num py-1.5 text-right">{dollars(p)}</td><td className="num py-1.5 text-right">{dollars(q)}</td><td className={`num py-1.5 text-right font-semibold ${Math.abs(d) < 1 ? 'text-ink-3' : ''}`}>{Math.abs(d) < 1 ? 'No change' : `${d > 0 ? '+' : '−'}${dollars(d)}`}</td></tr>; })}</tbody></table></div>
            <p className="meta mt-2">Includes the low income tax offset and the Medicare levy’s low-income phase-in. Rates: <a href={TX.brackets_url}>ATO, {TX.income_year}</a>.</p></div>
        </div>
      </section>
      <section className="card card-pad">
        <h3 className="h3">Income splitting for couples</h3>
        <p className="meta mt-1 max-w-[75ch]">Australia taxes each person on their own income. Under income splitting, a couple adds their incomes together and each is taxed on half. One-income couples save the most; couples who earn similar amounts save little or nothing.</p>
        <fieldset className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><legend className="sr-only">Allow income splitting for</legend>
          {([[0, 'Nobody (current law)'], [2, 'Couples with a dependent child'], [1, 'All couples']] as [0 | 1 | 2, string][]).map(([v, l]) => <label key={v} className="inline-flex items-center gap-2 text-[15px] font-semibold"><input type="radio" name="split" className="h-[18px] w-[18px] accent-[var(--brand)]" checked={t.split === v} disabled={v !== 0 && (!M.couplesOK || (v === 2 && !M.KIDS_SHARE))} onChange={() => change((r) => { r.split = v; })} />{l}</label>)}</fieldset>
        {M.couplesOK && <p className="mt-3 text-[14.5px] text-ink-2">Estimated cost a year at {isBase || (t.split && JSON.stringify({ ...t, split: 0 }) === JSON.stringify(M.baseRates)) ? 'current' : 'your'} rates: all couples about <b className="text-ink">{bn(costAll)}</b>; couples with a child about <b className="text-ink">{bn(costKids)}</b>.{t.split ? ' The option you chose is already taken off your income tax line.' : ''} {TX.couples?.pbo && <>The with-children figure is anchored to the <a href={TX.couples.pbo.url}>{TX.couples.pbo.source}</a> costing of that design ({bn(TX.couples.pbo.cost_m)} in {TX.couples.pbo.year}). </>}The all-couples figure uses the <a href={TX.couples?.url}>ATO’s {TX.couples?.income_year} sample</a>, the latest with both partners’ incomes, so treat it as a rough guide.</p>}
        <div className="mt-5 flex flex-wrap items-end gap-4"><label className="field">Partner 1’s taxable income, $<Num label="Partner 1 taxable income" value={a} step={1000} max={10000000} width={140} onCommit={(v) => setA(Math.min(1e7, Math.max(0, v)))} /></label><label className="field">Partner 2’s taxable income, $<Num label="Partner 2 taxable income" value={b} step={1000} max={10000000} width={140} onCommit={(v) => setB(Math.min(1e7, Math.max(0, v)))} /></label></div>
        <p className="mt-3 text-[15.5px]" role="status">Earning {dollars(a)} and {dollars(b)}, this couple pays <b>{dollars(sep)}</b> taxed separately. {gain < 1 ? 'Splitting wouldn’t change their tax, because their incomes are already even enough.' : <>Split evenly ({dollars((a + b) / 2)} each) they would pay <b>{dollars(spl)}</b>, saving <b>{dollars(gain)} a year</b>.</>}</p>
      </section>
    </div>);
}

/* ------------------------------------------------------------------ migration: evidence-scaled, kept apart from the budget lines */
function MigrationPanel({ MG, GDP }: { MG: Migration; GDP: number }) {
  const keys = [...MG.components.filter((c) => !c.fixed).map((c) => ({ id: c.id, base: c.value, max: Math.max(c.value * 3, 100000) })), ...MG.program.map((p) => ({ id: p.id, base: p.places, max: Math.max(p.places * 3, 30000) }))];
  const [v, setV] = useState<Record<string, number>>(() => Object.fromEntries(keys.map((k) => [k.id, k.base])));
  const set = (id: string, x: number) => { const k = keys.find((q) => q.id === id)!; if (Number.isFinite(x)) setV((o) => ({ ...o, [id]: Math.min(k.max, Math.max(0, Math.round(x))) })); };
  const R = MG.rules; const cite = (key: string) => { const e = MG.evidence.find((x) => x.key === key); return e ? <> (<a href={e.url} rel="noopener">{e.short}</a>)</> : null; };
  const dNom = MG.components.filter((c) => !c.fixed).reduce((a, c) => a + v[c.id] - c.value, 0), n = Math.abs(dNom), more = dNom > 0;
  const dProg = MG.program.reduce((a, p) => a + v[p.id] - p.places, 0), lifetime = MG.program.reduce((a, p) => a + (v[p.id] - p.places) * p.value, 0);
  const onPay = MG.program.reduce((a, p) => a + (v[p.id] - p.places) * (p.welfare?.jobseeker_pct ?? 0) / 100, 0);
  const row = (id: string, name: string, sub: string, base: number, max: number) => { const d = v[id] - base; return (
    <div key={id} className="rule-t mt-4 pt-4 first-of-type:mt-3 first-of-type:border-t-0 first-of-type:pt-0"><div className="flex items-baseline justify-between gap-2"><label htmlFor={`mig-${id}`} className="font-bold">{name}</label><span className="meta">{sub}</span></div>
      <input id={`mig-${id}`} type="range" min={0} max={max} step={1000} value={v[id]} onChange={(e) => set(id, Number(e.target.value))} aria-valuetext={`${n0(v[id])} people a year`} />
      <div className="flex flex-wrap items-center gap-4 text-[13px] font-semibold text-ink-2"><span className="inline-flex items-center gap-1.5">People a year <Num label={`${name}, people a year`} value={v[id]} step={1000} max={max} width={120} onCommit={(x) => set(id, x)} /></span><span className="num">{Math.abs(d) < 1 ? 'As forecast' : `${sgn(d)} a year`}</span>{Math.abs(d) >= 1 && <button type="button" className="ml-auto font-bold text-brand hover:underline" onClick={() => set(id, base)}>Reset</button>}</div></div>); };
  const topics = [...new Set(MG.evidence.map((e) => e.topic))];
  return (
    <div className="mt-5">
      <p className="max-w-[80ch] text-[15.5px] text-ink-2">Set net migration and the permanent program, and see what published research says would change. These results sit beside your budget rather than changing its lines, because migration’s effects build over years, not within one Budget.</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-5">
          <section className="card card-pad"><h3 className="h3">Net overseas migration</h3><p className="meta mt-1">Arrivals staying a year or more, minus departures. {MG.split_note}</p>
            {MG.components.map((c) => c.fixed ? <div key={c.id} className="rule-t mt-4 pt-4"><div className="flex items-baseline justify-between gap-2"><span className="font-bold">{c.name}</span><span className="meta num">{n0(c.value)} a year, as forecast</span></div><p className="meta mt-1">{c.note}</p></div> : row(c.id, c.name, c.sub ?? '', c.value, Math.max(c.value * 3, 100000)))}</section>
          <section className="card card-pad"><h3 className="h3">Permanent Migration Program</h3><p className="meta mt-1">Permanent visas granted each year. Many go to people already living here on temporary visas.</p>
            {MG.program.map((p) => row(p.id, p.name, `Lifetime budget effect per person, after welfare and services: ${p.value < 0 ? '−' : '+'}${dollars(p.value)}`, p.places, Math.max(p.places * 3, 30000)))}
            {MG.welfare && <div className="rule-t mt-5 pt-4"><h4 className="text-[14.5px] font-bold">How many rely on unemployment payments</h4><div className="table-scroll mt-2"><table className="w-full text-[13.5px]"><thead><tr className="text-[11.5px] uppercase tracking-wider text-ink-3"><th className="pb-1.5 text-left font-semibold">Stream</th><th className="pb-1.5 text-right font-semibold">First 5 yrs</th><th className="pb-1.5 text-right font-semibold">5–10 yrs</th><th className="pb-1.5 text-right font-semibold">10+ yrs</th><th className="pb-1.5 text-right font-semibold">Overall</th></tr></thead><tbody>
              {MG.program.filter((p) => p.welfare).map((p) => <tr key={p.id} className="border-t border-rule"><td className="py-1.5">{p.name.replace(/ (stream|program)$/, '')}</td>{p.welfare!.by_years.map((x, i) => <td key={i} className="num py-1.5 text-right">{x.toFixed(1)}%</td>)}<td className="num py-1.5 text-right font-bold">{p.welfare!.jobseeker_pct.toFixed(1)}%</td></tr>)}
              <tr className="border-t border-rule text-ink-3"><td className="py-1.5">All Australians aged 15–64</td><td /><td /><td /><td className="num py-1.5 text-right font-bold">{MG.welfare.population_pct.toFixed(1)}%</td></tr></tbody></table></div><p className="meta mt-2">{MG.welfare.note} Source: <a href={MG.welfare.url}>{MG.welfare.source}</a>.</p></div>}</section>
        </div>
        <div className="grid content-start gap-5">
          <section className="card card-pad"><h3 className="h3">What your settings would mean</h3>
            <ul className="mt-3 grid list-disc gap-2.5 pl-5 text-[15px]" aria-live="polite">
              <li><b>Net overseas migration: {n0(MG.nom_forecast + dNom)}</b> in {MG.year}, against the Budget forecast of {n0(MG.nom_forecast)}{n >= 1 ? ` (${n0(n)} ${more ? 'more' : 'fewer'})` : ''}.</li>
              {n < 1 ? <li>Move a slider to see what more or fewer people would mean for the economy, the budget, rents and housing.</li> : <>
                <li><b>Size of the economy:</b> about {(n / 100000 * R.gdp_pct_per_100k).toFixed(2)}% {more ? 'larger' : 'smaller'} over time, roughly {bn(n / 100000 * R.gdp_pct_per_100k / 100 * GDP)} a year at today’s size{cite('cfp')}.</li>
                <li><b>Economy per person:</b> little change either way. Official long-run modelling finds migration moves GDP per person by well under 1%{cite('igr')}.</li>
                <li><b>Federal budget:</b> about <b>{bn(Math.abs(dNom / R.pbo_step * (more ? R.pbo_up_m : R.pbo_down_m)), 0)} {more ? 'better' : 'worse'}</b> over the {R.pbo_period} if migration stays {n0(n)} {more ? 'above' : 'below'} forecast every year{cite('pbo')}. Federal budget only: states carry much of the cost of extra schools, hospitals and roads.{n > R.pbo_max && <i> This is a bigger change than the {n0(R.pbo_max)} a year the PBO modelled, so treat it as rough.</i>}</li>
                <li><b>Rents:</b> about {(n / R.rent_step * R.rent_pct).toFixed(1)}% {more ? 'higher' : 'lower'} than otherwise{cite('rba')}.</li>
                <li><b>Homes:</b> about {n0(Math.round(n / R.persons_per_home / 100) * 100)} {more ? 'more' : 'fewer'} needed, at {R.persons_per_home} people per home. For scale, {n0(R.completions)} homes were completed in {R.completions_year}{cite('nhsac')}.</li></>}
              {Math.abs(dProg) >= 1 && <li><b>Permanent program:</b> {n0(Math.abs(dProg))} {dProg > 0 ? 'more' : 'fewer'} places. Over their lifetimes, one year’s intake like this is worth about <b>{lifetime >= 0 ? '+' : '−'}{bn(Math.abs(lifetime) / 1e6)}</b> to federal and state budgets against the planned program (Treasury’s estimate, 2018–19 dollars){cite('treasury')}. That figure already subtracts welfare, health and education.</li>}
              {Math.abs(dProg) >= 1 && MG.welfare && <li><b>Welfare:</b> about {n0(Math.round(Math.abs(onPay) / 10) * 10)} {onPay >= 0 ? 'more' : 'fewer'} people from one year’s intake on unemployment payments at any time once settled{cite('abswelfare')}. Most new permanent residents wait four years before they can claim; humanitarian entrants don’t{cite('narwp')}.</li>}
            </ul></section>
          <section className="card card-pad"><h3 className="h3">Temporary visas: budget effect per person</h3><p className="meta mt-1">Average net effect on federal and state budgets over each visa holder’s stay, 2018–19 dollars (Treasury, 2021). Student figures leave out university fees.</p>
            <table className="mt-2 w-full text-[14px]"><tbody>{MG.temp_values.map((t) => <tr key={t.name} className="border-t border-rule first:border-0"><td className="py-1.5">{t.name}</td><td className="num py-1.5 text-right font-semibold">{t.value < 0 ? '−' : '+'}{dollars(t.value)}</td></tr>)}</tbody></table></section>
        </div>
      </div>
      <section className="card card-pad mt-5"><h3 className="h3">The evidence</h3><p className="meta mt-1">What official and peer-reviewed research has found, including where it cuts both ways.</p>
        {topics.map((tp, i) => <details key={tp} open={i === 0} className="rule-t mt-3 pt-3 first-of-type:border-t-0"><summary className="cursor-pointer text-[15.5px] font-bold">{tp}</summary><ul className="mt-2 grid list-disc gap-3 pl-5 text-[14.5px]">{MG.evidence.filter((e) => e.topic === tp).map((e) => <li key={e.key}>{e.finding}<span className="meta block">Source: <a href={e.url} rel="noopener">{e.source}</a></span></li>)}</ul></details>)}
        <p className="meta mt-4 rounded-lg bg-panel p-3">Limits: these figures cover government budgets, not every cost and benefit to people. None of the studies put a dollar value on congestion, pressure on services or productivity. Effects are scaled in a straight line from published scenarios, so the further a setting is from the forecast, the rougher the estimate.</p></section>
    </div>);
}
