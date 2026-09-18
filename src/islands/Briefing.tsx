import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

export interface BMeasure { id: string; title: string; value: string; caption: string; trend: 'up' | 'down' | 'steady' | null; tone: 'good' | 'bad' | 'neutral'; change: string; href: string }
export interface BTopic { id: string; title: string; measures: BMeasure[] }
interface Props {
  topics: BTopic[]; tally: { good: number; progress: number; risk: number; bad: number; total: number };
  moves: { better: BMeasure[]; worse: BMeasure[] }; due: { title: string; date: string; href: string }[];
  script: string[]; asAt: string; targetsHref: string;
}
const TONE = { good: '#4be3a0', bad: '#ff6b6b', neutral: '#5fd4ff', mixed: '#ffc857' };
const arrow = (t: BMeasure['trend']) => (t === 'up' ? '▲' : t === 'down' ? '▼' : '■');
const topicTone = (t: BTopic) => { const g = t.measures.filter((m) => m.tone === 'good').length, b = t.measures.filter((m) => m.tone === 'bad').length; return !g && !b ? 'neutral' : g > b ? 'good' : b > g ? 'bad' : 'mixed'; };

export default function Briefing({ topics, tally, moves, due, script, asAt, targetsHref }: Props) {
  const [sel, setSel] = useState(0); const [clock, setClock] = useState(''); const [speaking, setSpeaking] = useState(false); const [line, setLine] = useState(-1);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const stage = useRef<HTMLDivElement>(null); const labels = useRef<HTMLDivElement>(null); const selRef = useRef(0); selRef.current = sel;

  useEffect(() => { const tick = () => setClock(new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);
  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'; }, []);
  const lines = useMemo(() => [greeting + ' ' + script[0], ...script.slice(1)], [greeting, script]);

  function speak() {
    if (!canSpeak) return; const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); setLine(-1); return; }
    synth.cancel(); setSpeaking(true);
    const voices = synth.getVoices(); const voice = voices.find((v) => /en[-_]AU/i.test(v.lang)) ?? voices.find((v) => /en[-_]GB/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang));
    lines.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t); if (voice) u.voice = voice; u.rate = 1.02; u.pitch = 0.95; u.onstart = () => setLine(i); if (i === lines.length - 1) u.onend = () => { setSpeaking(false); setLine(-1); }; synth.speak(u); });
  }
  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);

  /* ---------------------------------------------------------------- the model: a core with one orbiting node per topic.
     Drag turns it. The mouse wheel and vertical swipes are left alone so the page always scrolls. */
  useEffect(() => {
    const el = stage.current, lab = labels.current; if (!el || !lab) return;
    let renderer: THREE.WebGLRenderer; try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { el.dataset.nowebgl = '1'; return; }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100); cam.position.set(0, 3.2, 9.5); cam.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(renderer.domElement); renderer.domElement.style.touchAction = 'pan-y';
    scene.add(new THREE.AmbientLight(0x6688aa, 0.9)); const key = new THREE.PointLight(0x9fdcff, 60, 40); key.position.set(4, 6, 6); scene.add(key);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    const glow = (color: string, s: number) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
    const root = new THREE.Group(); scene.add(root);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), new THREE.MeshBasicMaterial({ color: 0x5fd4ff, wireframe: true, transparent: true, opacity: 0.55 })); root.add(core, glow('#5fd4ff', 4.2));
    const R = 4.1; const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.01, R + 0.01, 128), new THREE.MeshBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 2; root.add(ring);
    const nodes = topics.map((t, i) => {
      const a = (i / topics.length) * Math.PI * 2, color = TONE[topicTone(t)]; const g = new THREE.Group(); g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.25, shininess: 0, transparent: true, opacity: 0.92 })); mesh.userData.i = i;
      const halo = glow(color, 2.4); const moons = new THREE.Group();
      t.measures.forEach((m, k) => { const b = (k / t.measures.length) * Math.PI * 2; const mm = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshBasicMaterial({ color: TONE[m.tone] })); mm.position.set(Math.cos(b) * 0.95, 0, Math.sin(b) * 0.95); moons.add(mm); });
      moons.rotation.x = 0.5; g.add(mesh, halo, moons);
      const spoke = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), g.position.clone()]), new THREE.LineBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.18 })); root.add(g, spoke);
      const tag = document.createElement('button'); tag.type = 'button'; tag.className = 'hud-tag'; tag.textContent = t.title; tag.addEventListener('click', () => setSel(i)); lab.appendChild(tag);
      return { g, mesh, halo, moons, tag };
    });
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let drag = false, moved = 0, lx = 0, vel = 0, raf = 0, W = 0, H = 0;
    const size = () => { W = el.clientWidth; H = el.clientHeight; renderer.setSize(W, H); cam.aspect = W / H; cam.position.z = W < 520 ? 12.5 : 9.5; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(size); ro.observe(el); size();
    const dom = renderer.domElement;
    const down = (e: PointerEvent) => { drag = true; moved = 0; lx = e.clientX; };
    const move = (e: PointerEvent) => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; moved += Math.abs(dx); root.rotation.y += dx * 0.006; vel = dx * 0.006; };
    const up = (e: PointerEvent) => { if (drag && moved < 5) { const r = dom.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam); const hit = ray.intersectObjects(nodes.map((n) => n.mesh))[0]; if (hit) setSel(hit.object.userData.i); } drag = false; };
    dom.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    const v = new THREE.Vector3(); let t0 = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      if (!drag) { root.rotation.y += reduce ? 0 : 0.05 * dt + vel; vel *= 0.94; }
      core.rotation.x += 0.12 * dt; core.rotation.z += 0.08 * dt;
      nodes.forEach((n, i) => { n.moons.rotation.y += (reduce ? 0 : 0.5) * dt; const on = i === selRef.current; const s = n.mesh.scale.x + ((on ? 1.35 : 1) - n.mesh.scale.x) * 0.12; n.mesh.scale.setScalar(s); n.halo.scale.setScalar(2.4 * (on ? 1.5 : 1));
        n.g.getWorldPosition(v); const depth = v.z; v.project(cam); n.tag.style.transform = `translate(-50%, 0) translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H + 26}px)`; n.tag.style.opacity = String(depth < -1 ? 0.45 : 1); n.tag.dataset.on = on ? '1' : ''; });
      renderer.render(scene, cam); raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); dom.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); renderer.dispose(); dom.remove(); lab.replaceChildren(); };
  }, [topics]);

  const T = topics[sel]; const circ = 2 * Math.PI * 52; let off = 0;
  const arcs = [[tally.good, TONE.good], [tally.progress, '#8aa0bd'], [tally.risk, TONE.mixed], [tally.bad, TONE.bad]].filter(([n]) => n) as [number, string][];
  return (
    <div className="hud">
      <div className="hud-bar"><span><b>DAILY BRIEFING</b> · DATA AS AT {asAt.toUpperCase()}</span><span className="num">{clock}</span></div>
      <div className="hud-grid">
        <div className="hud-col">
          <section className="hud-panel"><h2>Commitments</h2>
            <div className="flex items-center gap-4"><svg viewBox="0 0 120 120" width="112" height="112" role="img" aria-label={`${tally.good} of ${tally.total} commitments met or on track`}><circle cx="60" cy="60" r="52" fill="none" stroke="#16233a" strokeWidth="9" />
              {arcs.map(([n, c]) => { const len = (n / tally.total) * circ; const el = <circle key={c} cx="60" cy="60" r="52" fill="none" stroke={c} strokeWidth="9" strokeDasharray={`${Math.max(0, len - 3)} ${circ - len + 3}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" strokeLinecap="butt" />; off += len; return el; })}
              <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="700" fill="#e6f1ff">{tally.good}</text><text x="60" y="76" textAnchor="middle" fontSize="10" fill="#8aa0bd">OF {tally.total}</text></svg>
              <ul className="grid gap-1 text-[13px]"><li><i style={{ background: TONE.good }} />{tally.good} met or on track</li><li><i style={{ background: '#8aa0bd' }} />{tally.progress} in progress</li><li><i style={{ background: TONE.mixed }} />{tally.risk} at risk</li><li><i style={{ background: TONE.bad }} />{tally.bad} off track or not met</li></ul></div>
            <a href={targetsHref} className="hud-link">Open the tracker →</a></section>
          <section className="hud-panel"><h2>Biggest moves over the year</h2>
            <h3>Better</h3><ul className="hud-list">{moves.better.map((m) => <li key={m.id}><a href={m.href}><span>{m.title}</span><b style={{ color: TONE.good }}>{arrow(m.trend)} {m.change}</b></a></li>)}</ul>
            <h3 className="mt-3">Worse</h3><ul className="hud-list">{moves.worse.map((m) => <li key={m.id}><a href={m.href}><span>{m.title}</span><b style={{ color: TONE.bad }}>{arrow(m.trend)} {m.change}</b></a></li>)}</ul></section>
        </div>

        <div className="hud-stage-wrap"><div ref={stage} className="hud-stage" aria-hidden="true" /><div ref={labels} className="hud-labels" />
          <p className="hud-hint">Drag to turn · select a topic</p></div>

        <div className="hud-col">
          <section className="hud-panel" aria-live="polite"><h2>{T.title}</h2>
            <ul className="hud-list">{T.measures.map((m) => <li key={m.id}><a href={m.href}><span>{m.title}<small>{m.caption}</small></span><b>{m.value}<small style={{ color: TONE[m.tone] }}>{m.trend ? `${arrow(m.trend)} ${m.change}` : ''}</small></b></a></li>)}</ul>
            <div className="mt-3 flex flex-wrap gap-1.5">{topics.map((t, i) => <button key={t.id} type="button" className="hud-chip" aria-pressed={i === sel} onClick={() => setSel(i)}>{t.title}</button>)}</div></section>
          {due.length > 0 && <section className="hud-panel"><h2>Next reviews due</h2><ul className="hud-list">{due.map((d) => <li key={d.title}><a href={d.href}><span>{d.title}</span><b className="num">{d.date}</b></a></li>)}</ul></section>}
        </div>
      </div>

      <section className="hud-panel hud-brief"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="!mb-0">The briefing, in words</h2>
        {canSpeak && <button type="button" className="hud-btn" onClick={speak} aria-pressed={speaking}>{speaking ? '■ Stop' : '▶ Read it to me'}</button>}</div>
        <ol className="mt-3 grid gap-1.5">{lines.map((t, i) => <li key={i} data-on={i === line ? '1' : ''}>{t}</li>)}</ol>
        <p className="mt-3 text-[12.5px] opacity-70">Generated from the same official figures as the rest of the site. No opinion, no forecasts.</p></section>
    </div>);
}
