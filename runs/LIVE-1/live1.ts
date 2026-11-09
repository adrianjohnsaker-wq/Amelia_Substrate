// LIVE-1 runner: damage and regeneration in Amelia's live field, from her own checkpoint,
// in the tablet build's own code (Amelia-Orange 8f3bc33). Headless continuation exactly as the
// app plays the field: prepareRuntimeStep (recorded controls) then advanceWithLiveSource.
// Usage: bun run live1.ts <checkpoint.json> <out.json> [T=500]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { bornAmelia } from './src/core/fullNumogram';
import { restoreLiveField, captureLiveField } from './src/outside/LiveFieldLoop';
import { advanceWithLiveSource, getLiveSourceSession } from './src/outside/LiveSyntheticSourceSession';
import { ExternalRhythmHarmonizer } from './src/ai/morphogenetic/ExternalRhythmHarmonizer';

const FIXED = Date.parse('2026-11-09T12:00:00Z');
let clock = FIXED; Date.now = () => (clock += 450); // timestamps only; no effect on dynamics (checked by determinism probe)

const [ckPath, outPath] = [process.argv[2], process.argv[3]];
const T = Number(process.argv[4] ?? 500);
const raw = readFileSync(ckPath, 'utf8');
const ck = JSON.parse(raw);
const RADIUS = 5;
const GRID = [4, 12, 20, 28];
const SITES: { id: string; cx: number; cy: number }[] = [];
for (const cy of GRID) for (const cx of GRID) SITES.push({ id: `g${cx}_${cy}`, cx, cy });
SITES.push({ id: 'centre', cx: 16, cy: 16 });
const SAMPLE_T = [0, 1, 5, 10, 25, 50, 100, 200, 300, 400, 500].filter(t => t <= T);

function load() {
  clock = FIXED;
  const rt = bornAmelia();
  rt.importState(ck.state);
  const field = restoreLiveField(ck.fieldCheckpoint, rt);
  const harm = new ExternalRhythmHarmonizer();
  for (const d of ck.controls.rhythms) {
    const cur = harm.getRhythms().find(r => r.id === d.id)!;
    if (cur.active !== d.active) harm.toggleRhythm(d.id);
  }
  return { rt, field, harm };
}

/** Ablation: every cell within RADIUS of (cx, cy) on the torus is reset to the unpatterned state A = 1, B = 0. */
function ablate(field: any, cx: number, cy: number) {
  const W = field.width, H = field.height;
  const disc: number[] = [];
  const cells = field.cells.map((c: any, i: number) => {
    const x = i % W, y = Math.floor(i / W);
    const dx = Math.min(Math.abs(x - cx), W - Math.abs(x - cx)), dy = Math.min(Math.abs(y - cy), H - Math.abs(y - cy));
    if (Math.hypot(dx, dy) > RADIUS) return c;
    disc.push(i);
    return { ...c, A: 1, B: 0 };
  });
  return { field: { ...field, cells }, disc };
}

function run(site: { cx: number; cy: number } | null) {
  const L = load();
  let field: any = L.field;
  let disc: number[] = [];
  if (site) ({ field, disc } = ablate(field, site.cx, site.cy));
  const zones: number[] = [], disp: string[] = [], address: number[] = [], tension: number[] = [];
  const Bsamples: Record<number, number[]> = { 0: field.cells.map((c: any) => c.B) };
  for (let t = 1; t <= T; t++) {
    const next = (L.rt.getSnapshots().at(-1)?.step ?? 0) + 1;
    L.rt.setAdvisoryWeight(L.harm.computeAdvisoryTuning(ck.controls.advisoryWeight, next));
    L.rt.setMomentumDamping(ck.controls.momentumDamping);
    const r = advanceWithLiveSource(field);
    field = r.state;
    zones.push(L.rt.getCurrentZone());
    disp.push(r.currentSourceDecision?.disposition ?? 'NONE');
    address.push(getLiveSourceSession(field)!.sourceState.address);
    tension.push((L.rt.exportState() as any).governorState.deformationTension);
    if (SAMPLE_T.includes(t)) Bsamples[t] = field.cells.map((c: any) => c.B);
  }
  const st: any = L.rt.exportState();
  const attended = st.memoryState.events.slice(-T).reduce((n: number, e: any) =>
    n + (e.encounters ?? []).filter((x: any) => x.disposition === 'ATTEND').length, 0);
  return { disc, zones: zones.join(''), disp, address: address.join(''), tension, Bsamples, attended,
    biasVector: L.rt.getMemory().readMemoryBias().biasVector, governor: st.governorState,
    deferredQueue: st.deferredEncounters.length, fieldChecksum: captureLiveField(field, false).checksum };
}

const out: any = { checkpointSha256: createHash('sha256').update(raw).digest('hex'), T, RADIUS, SAMPLE_T, arms: {} };
out.arms.sham = run(null);
out.arms.sham_repeat = { fieldChecksum: run(null).fieldChecksum };
for (const s of SITES) { out.arms[s.id] = run(s); out.arms[s.id].site = s; process.stderr.write(s.id + ' '); }
writeFileSync(outPath, JSON.stringify(out));
console.error('\ndone');
