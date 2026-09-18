import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

export interface BMeasure {
  id: string; title: string; value: string; caption: string; period: string; question: string; href: string;
  trend: 'up' | 'down' | 'steady' | null; tone: 'good' | 'bad' | 'neutral'; change: string; span: string; year: string;
  influence: string; note: string; verdict: string; verdictTone: string; commitment: string;
}
export interface BTopic { id: string; title: string; blurb: string; measures: BMeasure[] }
export interface BStep { target: number; say: string }   // target: -1 = the whole record, otherwise a topic index
interface Props {
  topics: BTopic[]; tally: { good: number; progress: number; risk: number; bad: number; total: number };
  record: { better: number; worse: number; steady: number; total: number };
  moves: { better: BMeasure[]; worse: BMeasure[] }; due: { title: string; date: string; href: string }[];
  steps: BStep[]; asAt: string; since: string; targetsHref: string; government: string;
}
type Sel = { topic: number; measure: number };   // topic -1 = overall; measure -1 = none
const TONE = { good: '#4be3a0', bad: '#ff6b6b', neutral: '#5fd4ff', mixed: '#ffc857', warn: '#ffc857' } as const;
const arrow = (t: BMeasure['trend']) => (t === 'up' ? '▲' : t === 'down' ? '▼' : t === 'steady' ? '■' : '');
const counts = (t: BTopic) => ({ g: t.measures.filter((m) => m.tone === 'good').length, b: t.measures.filter((m) => m.tone === 'bad').length });
const topicTone = (t: BTopic) => { const { g, b } = counts(t); return !g && !b ? 'neutral' : g > b ? 'good' : b > g ? 'bad' : 'mixed'; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const speakable = (s: string) => s.replace(/−/g, 'minus ').replace(/(\d)%/g, '$1 per cent').replace(/\bpts\b/g, 'points').replace(/\$([\d.,]+)bn/g, '$1 billion dollars').replace(/\$([\d.,]+)m\b/g, '$1 million dollars');

export default function Briefing({ topics, tally, record, moves, due, steps, asAt, since, targetsHref, government }: Props) {
  const [sel, setSel] = useState<Sel>({ topic: -1, measure: -1 });
  const [clock, setClock] = useState(''); const [tour, setTour] = useState(-1); const [typed, setTyped] = useState(''); const [voice, setVoice] = useState(true);
  const stage = useRef<HTMLDivElement>(null), labels = useRef<HTMLDivElement>(null); const selRef = useRef(sel); selRef.current = sel;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const tourRef = useRef(tour); tourRef.current = tour;
  // Reads the tour through a ref: the 3D scene's click handlers are created once and would otherwise see a stale value.
  const pick = (s: Sel, user = true) => { if (user && tourRef.current >= 0) stopTour(); setSel(s); };

  useEffect(() => { const tick = () => setClock(new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);

  /* ---------------------------------------------------------------- guided, spoken briefing: the model follows the voice */
  const timers = useRef<number[]>([]);
  function stopTour() { timers.current.forEach(clearTimeout); timers.current = []; if (canSpeak) window.speechSynthesis.cancel(); setTour(-1); setTyped(''); }
  function runStep(i: number) {
    if (i >= steps.length) { stopTour(); setSel({ topic: -1, measure: -1 }); return; }
    const st = steps[i]; setTour(i); setSel({ topic: st.target, measure: -1 });
    const text = i === 0 ? `${new Date().getHours() < 12 ? 'Good morning.' : new Date().getHours() < 18 ? 'Good afternoon.' : 'Good evening.'} ${st.say}` : st.say;
    timers.current.forEach(clearTimeout); timers.current = []; setTyped('');
    for (let k = 1; k <= text.length; k += 2) timers.current.push(window.setTimeout(() => setTyped(text.slice(0, k + 1)), k * 14));
    if (canSpeak && voice) {
      const synth = window.speechSynthesis; synth.cancel(); const u = new SpeechSynthesisUtterance(speakable(text)); const vs = synth.getVoices();
      const v = vs.find((x) => /en[-_]AU/i.test(x.lang)) ?? vs.find((x) => /en[-_]GB/i.test(x.lang)) ?? vs.find((x) => /^en/i.test(x.lang)); if (v) u.voice = v; u.rate = 1.03; u.pitch = 0.95;
      u.onend = () => { timers.current.push(window.setTimeout(() => runStep(i + 1), 500)); }; synth.speak(u);
    } else timers.current.push(window.setTimeout(() => runStep(i + 1), Math.max(4500, text.length * 55)));
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout); if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);

  /* ---------------------------------------------------------------- the model. Drag turns it; the wheel and vertical swipes always scroll the page. */
  useEffect(() => {
    const el = stage.current, lab = labels.current; if (!el || !lab) return;
    let renderer: THREE.WebGLRenderer; try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { el.dataset.nowebgl = '1'; return; }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(renderer.domElement); renderer.domElement.style.touchAction = 'pan-y';
    scene.add(new THREE.AmbientLight(0x6688aa, 0.9)); const key = new THREE.PointLight(0x9fdcff, 70, 50); key.position.set(4, 7, 8); scene.add(key);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    const glow = (color: string, s: number) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
    const root = new THREE.Group(); scene.add(root);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), new THREE.MeshBasicMaterial({ color: 0x5fd4ff, wireframe: true, transparent: true, opacity: 0.6 })); core.userData.pick = { topic: -1, measure: -1 };
    const coreHit = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({ visible: false })); coreHit.userData.pick = { topic: -1, measure: -1 }; root.add(core, coreHit, glow('#5fd4ff', 3.8));
    const R = 4.3; const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.012, R + 0.012, 160), new THREE.MeshBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 2; root.add(ring);
    const tag = (cls: string, html: string, onClick: () => void) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.innerHTML = html; b.addEventListener('click', onClick); lab.appendChild(b); return b; };
    const pickables: THREE.Object3D[] = [coreHit];
    const coreTag = tag('hud-tag hud-tag-core', `THE RECORD<small>${record.better} better · ${record.worse} worse</small>`, () => pick({ topic: -1, measure: -1 }));
    const nodes = topics.map((t, i) => {
      const a = (i / topics.length) * Math.PI * 2, color = TONE[topicTone(t)], { g, b } = counts(t); const grp = new THREE.Group(); grp.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 24), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.22, shininess: 0, transparent: true, opacity: 0.9 })); mesh.userData.pick = { topic: i, measure: -1 };
      const halo = glow(color, 2.3); const moons = new THREE.Group(); moons.rotation.x = 0.42;
      const moonMeshes = t.measures.map((m, k) => { const bb = (k / t.measures.length) * Math.PI * 2; const mm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), new THREE.MeshBasicMaterial({ color: TONE[m.tone] })); mm.position.set(Math.cos(bb) * 1.12, 0, Math.sin(bb) * 1.12); mm.userData.pick = { topic: i, measure: k }; moons.add(mm); pickables.push(mm); return mm; });
      const orbit = new THREE.Mesh(new THREE.RingGeometry(1.115, 1.125, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); orbit.rotation.x = Math.PI / 2; moons.add(orbit);
      grp.add(mesh, halo, moons); pickables.push(mesh);
      const spoke = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), grp.position.clone()]), new THREE.LineBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.16 }));
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0x9fe6ff })); root.add(grp, spoke, pulse);
      const el2 = tag('hud-tag', `${esc(t.title)}<small>${b ? `<i style="color:${TONE.bad}">${b} worse</i>` : ''}${b && g ? ' · ' : ''}${g ? `<i style="color:${TONE.good}">${g} better</i>` : ''}${!b && !g ? 'no verdict' : ''}</small>`, () => pick({ topic: i, measure: -1 }));
      const moonTags = t.measures.map((m, k) => tag('hud-tag hud-tag-moon', `${esc(m.title)}<small><b>${esc(m.value)}</b>${m.change ? ` <i style="color:${TONE[m.tone]}">${arrow(m.trend)} ${esc(m.change)}</i>` : ''}</small>`, () => pick({ topic: i, measure: k })));
      return { a, grp, mesh, halo, moons, moonMeshes, tag: el2, moonTags, pulse };
    });
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let drag = false, moved = 0, lx = 0, vel = 0, raf = 0, W = 0, H = 0, goalRot = 0;
    const camPos = new THREE.Vector3(0, 3.4, 10.5), look = new THREE.Vector3(), camGoal = camPos.clone(), lookGoal = new THREE.Vector3();
    const size = () => { W = el.clientWidth; H = el.clientHeight; renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(size); ro.observe(el); size();
    const dom = renderer.domElement;
    const down = (e: PointerEvent) => { drag = true; moved = 0; lx = e.clientX; };
    const move = (e: PointerEvent) => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; moved += Math.abs(dx); root.rotation.y += dx * 0.006; goalRot = root.rotation.y; vel = dx * 0.006; };
    const up = (e: PointerEvent) => { if (drag && moved < 5) { const r = dom.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam); const hit = ray.intersectObjects(pickables)[0]; if (hit) pick(hit.object.userData.pick); } drag = false; };
    dom.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    const v = new THREE.Vector3(); let t0 = performance.now(), lastTopic = -2, clockT = 0;
    const place = (btn: HTMLElement, obj: THREE.Object3D, dy: number, show: boolean) => { obj.getWorldPosition(v); const behind = v.z < -1.5; v.project(cam); btn.style.transform = `translate(-50%, 0) translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H + dy}px)`; btn.style.opacity = show ? (behind ? '0.35' : '1') : '0'; btn.style.pointerEvents = show ? 'auto' : 'none'; };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now; clockT += dt; const s = selRef.current, narrow = W < 640;
      if (s.topic !== lastTopic) { lastTopic = s.topic; if (s.topic >= 0) { let g = nodes[s.topic].a - Math.PI / 2; while (g - root.rotation.y > Math.PI) g -= Math.PI * 2; while (g - root.rotation.y < -Math.PI) g += Math.PI * 2; goalRot = g; } }
      if (s.topic >= 0) { camGoal.set(0, 1.9, narrow ? 10.4 : 9.4); lookGoal.set(0, 0.15, R * 0.8); if (!drag) root.rotation.y += (goalRot - root.rotation.y) * Math.min(1, dt * 3.2); }
      else { camGoal.set(0, 3.4, narrow ? 13.5 : 10.5); lookGoal.set(0, 0, 0); if (!drag) { root.rotation.y += (reduce ? 0 : 0.045 * dt) + vel; vel *= 0.94; } }
      camPos.lerp(camGoal, Math.min(1, dt * 2.6)); look.lerp(lookGoal, Math.min(1, dt * 2.6)); cam.position.copy(camPos); cam.lookAt(look);
      core.rotation.x += 0.12 * dt; core.rotation.z += 0.08 * dt; place(coreTag, core, 30, s.topic < 0);
      nodes.forEach((n, i) => { const on = i === s.topic; if (!on && !reduce) n.moons.rotation.y += 0.45 * dt; else if (on) n.moons.rotation.y += (0 - (n.moons.rotation.y % (Math.PI * 2))) * Math.min(1, dt * 3);
        const sc = n.mesh.scale.x + ((on ? 1.25 : 1) - n.mesh.scale.x) * 0.12; n.mesh.scale.setScalar(sc); n.halo.scale.setScalar(2.3 * (on ? 1.45 : s.topic >= 0 ? 0.7 : 1)); (n.halo.material as THREE.SpriteMaterial).opacity = s.topic >= 0 && !on ? 0.35 : 1; (n.mesh.material as THREE.MeshPhongMaterial).opacity = s.topic >= 0 && !on ? 0.35 : 0.9;
        const f = ((clockT * 0.22 + i / nodes.length) % 1); n.pulse.position.copy(n.grp.position).multiplyScalar(f); n.pulse.visible = !reduce;
        place(n.tag, n.grp, 34, s.topic < 0 || on); n.tag.dataset.on = on ? '1' : '';
        n.moonMeshes.forEach((mm, k) => { const hot = on && s.measure === k; mm.scale.setScalar(hot ? 1.9 : 1); place(n.moonTags[k], mm, 12, on && !narrow); n.moonTags[k].dataset.on = hot ? '1' : ''; }); });
      renderer.render(scene, cam); raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); dom.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); renderer.dispose(); dom.remove(); lab.replaceChildren(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  const T = sel.topic >= 0 ? topics[sel.topic] : null, Mx = T && sel.measure >= 0 ? T.measures[sel.measure] : null;
  const ticker = useMemo(() => topics.flatMap((t) => t.measures).filter((m) => m.change), [topics]);
  const circ = 2 * Math.PI * 52; let off = 0;
  const arcs = [[tally.good, TONE.good], [tally.progress, '#8aa0bd'], [tally.risk, TONE.mixed], [tally.bad, TONE.bad]].filter(([n]) => n) as [number, string][];
  const Row = ({ m, onClick }: { m: BMeasure; onClick?: () => void }) => { const inner = <><span>{m.title}<small>{m.caption}</small></span><b>{m.value}<small style={{ color: TONE[m.tone] }}>{m.change ? `${arrow(m.trend)} ${m.change} since ${since}` : m.verdict}</small></b></>; return <li>{onClick ? <button type="button" onClick={onClick}>{inner}</button> : <a href={m.href}>{inner}</a>}</li>; };

  return (
    <div className="hud">
      <div className="hud-bar"><span><b>THE BRIEFING</b> · {government.toUpperCase()} · RECORD SINCE {since.toUpperCase()} · DATA AS AT {asAt.toUpperCase()}</span><span className="num">{clock}</span></div>

      <div className="hud-main">
        <div className="hud-stage-wrap"><div ref={stage} className="hud-stage" aria-hidden="true" /><div ref={labels} className="hud-labels" />
          <span className="hud-corner tl" /><span className="hud-corner tr" /><span className="hud-corner bl" /><span className="hud-corner br" />
          <div className="hud-tour">
            {tour >= 0 ? <><p className="hud-say" role="status">{typed}</p><div className="hud-tourctl"><button type="button" className="hud-chip" onClick={() => runStep(Math.max(0, tour - 1))} aria-label="Previous">◀</button><span className="num">{tour + 1} / {steps.length}</span><button type="button" className="hud-chip" onClick={() => runStep(tour + 1)} aria-label="Next">▶</button><button type="button" className="hud-chip" onClick={stopTour}>■ Stop</button></div></>
              : <div className="hud-tourctl"><button type="button" className="hud-btn" onClick={() => runStep(0)}>▶ Start the briefing</button>{canSpeak && <label className="hud-toggle"><input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /> Read it aloud</label>}{sel.topic >= 0 && <button type="button" className="hud-chip" onClick={() => pick({ topic: -1, measure: -1 })}>◂ Whole record</button>}</div>}
          </div>
          <p className="hud-legend"><i style={{ background: TONE.good }} />better since {since}<i style={{ background: TONE.bad }} />worse<i style={{ background: TONE.mixed }} />mixed<i style={{ background: TONE.neutral }} />no verdict · drag to turn · select a sphere or a moon</p>
        </div>

        <aside className="hud-panel hud-detail" aria-live="polite">
          {Mx && T ? (<>
            <button type="button" className="hud-back" onClick={() => pick({ topic: sel.topic, measure: -1 })}>◂ {T.title}</button>
            <h2>{Mx.verdict ? 'Commitment' : 'Measure'}</h2><p className="hud-title">{Mx.title}</p><p className="hud-dim">{Mx.question}</p>
            <p className="hud-big">{Mx.value}<small>{Mx.caption}{Mx.period ? ` · ${Mx.period}` : ''}</small></p>
            {Mx.verdict && <p className="hud-fact"><b style={{ color: TONE[(Mx.verdictTone === 'warn' ? 'mixed' : Mx.verdictTone) as keyof typeof TONE] ?? TONE.neutral }}>{Mx.verdict}</b>{Mx.commitment}</p>}
            {Mx.change && <p className="hud-fact"><b style={{ color: TONE[Mx.tone] }}>{arrow(Mx.trend)} {Mx.change}</b>since the government took office ({Mx.span})</p>}
            {Mx.year && <p className="hud-fact"><b>{Mx.year}</b>over the past year</p>}
            <p className="hud-fact"><b>{Mx.influence}</b>how much Canberra controls this</p>
            {Mx.note && <p className="hud-note"><b>Starting point:</b> {Mx.note}</p>}
            <a href={Mx.href} className="hud-btn hud-btn-block">Open the full record, chart and sources →</a></>)
          : T ? (<>
            <button type="button" className="hud-back" onClick={() => pick({ topic: -1, measure: -1 })}>◂ Whole record</button>
            <h2>Topic · {T.measures.length} measures</h2><p className="hud-title">{T.title}</p><p className="hud-dim">{T.blurb}</p>
            <div className="hud-stats"><div><b style={{ color: TONE.bad }}>{counts(T).b}</b>worse since {since}</div><div><b style={{ color: TONE.good }}>{counts(T).g}</b>better</div><div><b>{T.measures.length - counts(T).b - counts(T).g}</b>no verdict</div></div>
            <ul className="hud-list">{T.measures.map((m, k) => <Row key={m.id} m={m} onClick={() => pick({ topic: sel.topic, measure: k })} />)}</ul></>)
          : (<>
            <h2>The record since {since}</h2><p className="hud-title">{government}</p>
            <p className="hud-dim">Of {record.total} measures where nearly everyone agrees which way is better, on the latest official figures:</p>
            <div className="hud-stats"><div><b style={{ color: TONE.bad }}>{record.worse}</b>worse</div><div><b style={{ color: TONE.good }}>{record.better}</b>better</div><div><b>{record.steady}</b>little changed</div></div>
            <h3 className="mt-4">Biggest deteriorations</h3><ul className="hud-list">{moves.worse.map((m) => <Row key={m.id} m={m} />)}</ul>
            <h3 className="mt-4">Biggest improvements</h3><ul className="hud-list">{moves.better.map((m) => <Row key={m.id} m={m} />)}</ul>
            <div className="mt-4 flex flex-wrap gap-1.5">{topics.map((t, i) => <button key={t.id} type="button" className="hud-chip" onClick={() => pick({ topic: i, measure: -1 })}>{t.title}</button>)}</div></>)}
        </aside>
      </div>

      <div className="hud-ticker" aria-hidden="true"><b>LIVE</b><div><p>{[...ticker, ...ticker].map((m, i) => <span key={i}>{m.title} <em>{m.value}</em> <i style={{ color: TONE[m.tone] }}>{arrow(m.trend)} {m.change}</i></span>)}</p></div></div>

      <div className="hud-under">
        <section className="hud-panel"><h2>Promises: kept and broken</h2>
          <div className="flex items-center gap-4"><svg viewBox="0 0 120 120" width="108" height="108" role="img" aria-label={`${tally.good} of ${tally.total} commitments met or on track`}><circle cx="60" cy="60" r="52" fill="none" stroke="#16233a" strokeWidth="9" />
            {arcs.map(([n, c]) => { const len = (n / tally.total) * circ; const e = <circle key={c} cx="60" cy="60" r="52" fill="none" stroke={c} strokeWidth="9" strokeDasharray={`${Math.max(0, len - 3)} ${circ - len + 3}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />; off += len; return e; })}
            <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="700" fill="#e6f1ff">{tally.good}</text><text x="60" y="76" textAnchor="middle" fontSize="10" fill="#8aa0bd">OF {tally.total} KEPT</text></svg>
            <ul className="grid gap-1 text-[13px]"><li><i style={{ background: TONE.good }} />{tally.good} met or on track</li><li><i style={{ background: '#8aa0bd' }} />{tally.progress} in progress</li><li><i style={{ background: TONE.mixed }} />{tally.risk} at risk</li><li><i style={{ background: TONE.bad }} />{tally.bad} off track or not met</li></ul></div>
          <a href={targetsHref} className="hud-link">Open the commitments tracker →</a></section>
        {due.length > 0 && <section className="hud-panel"><h2>Next figures due for review</h2><ul className="hud-list">{due.map((d) => <li key={d.title}><a href={d.href}><span>{d.title}</span><b className="num">{d.date}</b></a></li>)}</ul></section>}
        <section className="hud-panel"><h2>How to read this</h2><p className="hud-dim !mt-0">Each sphere is a topic; each moon is one official measure. Colour shows whether it is better or worse than when the government took office, and is used only where nearly everyone agrees which way is better. Figures outside the government’s direct control are labelled as such. No opinion, no forecasts.</p></section>
      </div>
    </div>);
}
