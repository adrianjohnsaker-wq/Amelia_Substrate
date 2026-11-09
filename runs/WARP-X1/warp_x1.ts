// WARP-X1 runner: branch copies of Amelia's checkpoint with the Warp given an exit by her own rule
// (3->D and 6->D added at the mean flux, permeability and resistance of her 11 base gates), D = 9 or 1.
// Recorded Outside delivered through the native path exactly as in WARP-L1.
// Usage: bun run warp_x1.ts <checkpoint.json> <outside_stream.json> <out.json> [windows=10]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { bornAmelia } from './src/core/fullNumogram';
import { ExternalRhythmHarmonizer } from './src/ai/morphogenetic/ExternalRhythmHarmonizer';

let clock = Date.parse('2026-11-09T12:00:00Z'); Date.now = () => (clock += 450);
const [ckPath, streamPath, outPath] = process.argv.slice(2, 5);
const NW = Number(process.argv[5] ?? 10);
const raw = readFileSync(ckPath, 'utf8'); const ck = JSON.parse(raw);
const stream = JSON.parse(readFileSync(streamPath, 'utf8'));
const PER = 60, EVERY = 5, INPUT = PER * EVERY, AFTER = 300, T = INPUT + AFTER;
const SWAP90 = [9, 1, 2, 3, 4, 5, 6, 7, 8, 0];

const base = ck.state.qabbalaGates.filter((g: any) => !String(g.id).startsWith('ccru-'));
const mean = (f: string) => base.reduce((s: number, g: any) => s + g[f], 0) / base.length;
const RULE = { flux: mean('flux'), permeability: mean('permeability'), resistance: mean('resistance') };

function exitGates(dest: number | null) {
  if (dest === null) return ck.state.qabbalaGates;
  return [...ck.state.qabbalaGates.map((g: any) => ({ ...g })), ...[3, 6].map(s => ({
    id: `branch-exit-${s}-${dest}`, source: s, target: dest, label: `Branch-only Warp exit (${s}->${dest}), by her added-edge rule`,
    flux: RULE.flux, permeability: RULE.permeability, isOpen: true, resistance: RULE.resistance }))];
}
function load(dest: number | null) {
  clock = Date.parse('2026-11-09T12:00:00Z');
  const rt = bornAmelia(); rt.importState({ ...ck.state, qabbalaGates: exitGates(dest) });
  const harm = new ExternalRhythmHarmonizer();
  for (const d of ck.controls.rhythms) { const c = harm.getRhythms().find(r => r.id === d.id)!; if (c.active !== d.active) harm.toggleRhythm(d.id); }
  return { rt, harm };
}
function run(dest: number | null, arm: string, window: number) {
  const L = load(dest);
  const zones: number[] = []; const delivered: string[] = [];
  for (let t = 1; t <= T; t++) {
    const next = (L.rt.getSnapshots().at(-1)?.step ?? 0) + 1;
    L.rt.setAdvisoryWeight(L.harm.computeAdvisoryTuning(ck.controls.advisoryWeight, next));
    L.rt.setMomentumDamping(ck.controls.momentumDamping);
    let enc: any;
    if (arm !== 'sham' && t <= INPUT && (t - 1) % EVERY === 0) {
      const s = stream[window * PER + (t - 1) / EVERY];
      const v = arm === 'stream' ? [...s.attentionVector] : SWAP90.map(i => s.attentionVector[i]);
      enc = { eventId: `outside:${s.seq}:${arm}`, channel: s.channel, sourceDigest: s.sourceDigest, attentionVector: v };
    }
    const snap: any = L.rt.step(undefined, enc);
    zones.push(L.rt.getCurrentZone());
    if (enc) delivered.push(snap.encounterDecisions?.find((x: any) => x.eventId === enc.eventId)?.disposition ?? 'NONE');
  }
  const st: any = L.rt.exportState();
  const admitted = st.memoryState.events.slice(-T).reduce((n: number, e: any) =>
    n + (e.encounters ?? []).filter((x: any) => x.disposition === 'ATTEND' && String(x.eventId).startsWith('outside:')).length, 0);
  const gatesUsed = st.qabbalaGates.filter((g: any) => String(g.id).startsWith('branch-exit')).length;
  return { zones: zones.join(''), delivered, admitted, tensionEnd: st.governorState.deformationTension, gatesPresentAtEnd: gatesUsed };
}
const out: any = { checkpointSha256: createHash('sha256').update(raw).digest('hex'),
  streamSha256: createHash('sha256').update(readFileSync(streamPath)).digest('hex'), RULE, PER, EVERY, INPUT, AFTER };
out.noExitSham = run(null, 'sham', 0);
out.exit9 = { sham: run(9, 'sham', 0), shamRepeat: run(9, 'sham', 0).zones, windows: [] as any[] };
out.exit1 = { sham: run(1, 'sham', 0), windows: [] as any[] };
out.exit9.shamRepeat = out.exit9.shamRepeat === out.exit9.sham.zones;
for (let w = 0; w < NW; w++) {
  out.exit9.windows.push({ window: w, stream: run(9, 'stream', w), swap: run(9, 'swap', w) });
  out.exit1.windows.push({ window: w, stream: run(1, 'stream', w) });
  process.stderr.write(w + ' ');
}
writeFileSync(outPath, JSON.stringify(out));
console.error('done');
