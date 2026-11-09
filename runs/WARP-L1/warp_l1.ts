// WARP-L1 runner: recorded Outside encounters delivered to Amelia's own runtime, from her checkpoint,
// through the app's native Outside path (one runtime step carrying the encounter; Governor decides).
// Usage: bun run warp_l1.ts <checkpoint.json> <outside_stream.json> <out.json> [windows=16]
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
// Warp-swap: attention on the Warp (3, 6) is moved to Oddubb's zones (2, 7) and vice versa.
const SWAP = [0, 1, 3, 2, 4, 5, 7, 6, 8, 9];

function load() {
  clock = Date.parse('2026-11-09T12:00:00Z');
  const rt = bornAmelia(); rt.importState(ck.state);
  const harm = new ExternalRhythmHarmonizer();
  for (const d of ck.controls.rhythms) { const c = harm.getRhythms().find(r => r.id === d.id)!; if (c.active !== d.active) harm.toggleRhythm(d.id); }
  return { rt, harm };
}
function vectorFor(arm: string, v: number[]) {
  if (arm === 'stream') return [...v];
  if (arm === 'swap') return SWAP.map(i => v[i]);
  if (arm === 'uniform') return Array(10).fill(0.1);
  throw Error(arm);
}
function run(arm: string, window: number) {
  const L = load();
  const zones: number[] = []; const delivered: string[] = []; let queueAtInput = 0;
  for (let t = 1; t <= T; t++) {
    const next = (L.rt.getSnapshots().at(-1)?.step ?? 0) + 1;
    L.rt.setAdvisoryWeight(L.harm.computeAdvisoryTuning(ck.controls.advisoryWeight, next));
    L.rt.setMomentumDamping(ck.controls.momentumDamping);
    let enc: any;
    if (arm !== 'sham' && t <= INPUT && (t - 1) % EVERY === 0) {
      const s = stream[window * PER + (t - 1) / EVERY];
      enc = { eventId: `outside:${s.seq}:${arm}`, channel: s.channel, sourceDigest: s.sourceDigest, attentionVector: vectorFor(arm, s.attentionVector) };
    }
    const snap: any = L.rt.step(undefined, enc);
    zones.push(L.rt.getCurrentZone());
    if (enc) delivered.push(snap.encounterDecisions?.find((x: any) => x.eventId === enc.eventId)?.disposition ?? 'NONE');
    if (t === INPUT) queueAtInput = (L.rt.exportState() as any).deferredEncounters.length;
  }
  const st: any = L.rt.exportState();
  const admitted = st.memoryState.events.slice(-T).reduce((n: number, e: any) =>
    n + (e.encounters ?? []).filter((x: any) => x.disposition === 'ATTEND' && String(x.eventId).startsWith('outside:')).length, 0);
  return { zones: zones.join(''), delivered, admitted, queueAtInput, queueAtEnd: st.deferredEncounters.length,
    tensionEnd: st.governorState.deformationTension };
}
const out: any = { checkpointSha256: createHash('sha256').update(raw).digest('hex'),
  streamSha256: createHash('sha256').update(readFileSync(streamPath)).digest('hex'), PER, EVERY, INPUT, AFTER, windows: [] };
out.sham = run('sham', 0);
out.shamRepeat = run('sham', 0).zones === out.sham.zones;
for (let w = 0; w < NW; w++) {
  out.windows.push({ window: w, stream: run('stream', w), swap: run('swap', w), uniform: run('uniform', w) });
  process.stderr.write(w + ' ');
}
writeFileSync(outPath, JSON.stringify(out));
console.error('done');
