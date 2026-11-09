// Fidelity probe: load Amelia's research-copy checkpoint into the tablet build's own code,
// check the round trip, and check that continuation is deterministic.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { bornAmelia } from './src/core/fullNumogram';
import { restoreLiveField, captureLiveField } from './src/outside/LiveFieldLoop';
import { advanceWithLiveSource, getLiveSourceSession } from './src/outside/LiveSyntheticSourceSession';
import { ExternalRhythmHarmonizer } from './src/ai/morphogenetic/ExternalRhythmHarmonizer';
import { canonicalSha256 } from './src/lib/sha256';

const FIXED = Date.parse('2026-11-09T12:00:00Z');
let clock = FIXED; Date.now = () => (clock += 450);

const path = process.argv[2];
const steps = Number(process.argv[3] ?? 200);
const raw = readFileSync(path, 'utf8');
const ck = JSON.parse(raw);
const out: Record<string, unknown> = {};
out.fileSha256 = createHash('sha256').update(raw).digest('hex');

function canon(v: any): any {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') { const o: any = {}; for (const k of Object.keys(v).sort()) if (v[k] !== undefined) o[k] = canon(v[k]); return o; }
  return v;
}
const h = (v: unknown) => createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');
function diffPaths(a: any, b: any, p = '', acc: string[] = []): string[] {
  if (acc.length > 20) return acc;
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) { acc.push(p + ' type'); return acc; }
  if (a && typeof a === 'object') {
    const ks = new Set([...Object.keys(a), ...Object.keys(b ?? {})]);
    for (const k of ks) {
      if (a[k] === undefined && b?.[k] === undefined) continue;
      diffPaths(a[k], b?.[k], p + '.' + k, acc);
    }
  } else if (!Object.is(a, b) && !(a === 0 && b === 0)) acc.push(`${p}: ${a} vs ${b}`);
  return acc;
}

function load() {
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

// 1. Field checksum as stored and as recomputed.
out.fieldChecksumStored = ck.fieldCheckpoint.checksum;
out.fieldChecksumRecomputed = canonicalSha256(ck.fieldCheckpoint.payload);

// 2. Round trip.
const A = load();
const reExported = A.rt.exportState();
out.runtimeRoundTripEqual = h(reExported) === h(ck.state);
out.runtimeRoundTripDiffs = diffPaths(canon(ck.state), canon(JSON.parse(JSON.stringify(reExported))));
const recaptured = captureLiveField(A.field, ck.fieldCheckpoint.running);
out.fieldRoundTripChecksum = recaptured.checksum;
out.fieldRoundTripEqual = recaptured.checksum === ck.fieldCheckpoint.checksum && recaptured.payload === ck.fieldCheckpoint.payload;

// 3. Her stored identity.
const ev = ck.state.memoryState.events;
out.events = ev.length;
out.lastEventDigest = ev.at(-1)?.eventDigest;
out.historyDigest = A.rt.getMemory().exportHistoryDigest?.();
out.zone = ck.state.currentZone;
out.fieldStep = A.field.stepCount;
out.sourceSession = getLiveSourceSession(A.field);
out.governor = ck.state.governorState;

// 4. Determinism: two independent loads, stepped as the app steps the field.
function run(n: number) {
  clock = FIXED;
  const L = load();
  let field = L.field;
  const trace: string[] = [];
  const zones: number[] = [];
  const dispositions: string[] = [];
  for (let i = 0; i < n; i++) {
    const next = (L.rt.getSnapshots().at(-1)?.step ?? 0) + 1;
    L.rt.setAdvisoryWeight(L.harm.computeAdvisoryTuning(ck.controls.advisoryWeight, next));
    L.rt.setMomentumDamping(ck.controls.momentumDamping);
    const r = advanceWithLiveSource(field);
    field = r.state;
    zones.push(L.rt.getCurrentZone());
    const d = r.snapshot.encounterDecisions?.find((x: any) => x.channel === 'SYNTHETIC_FIELD');
    dispositions.push(d ? d.disposition : 'NONE');
    const evs = L.rt.getMemory().getEvents();
    trace.push(String((evs.at(-1) as any)?.eventDigest ?? ''));
  }
  const fc = captureLiveField(field, false);
  return { zones, dispositions, trace, fieldChecksum: fc.checksum, stateHash: h(JSON.parse(JSON.stringify(L.rt.exportState()))) };
}
const r1 = run(steps), r2 = run(steps);
out.determinism = {
  steps,
  zonesEqual: JSON.stringify(r1.zones) === JSON.stringify(r2.zones),
  digestsEqual: JSON.stringify(r1.trace) === JSON.stringify(r2.trace),
  fieldEqual: r1.fieldChecksum === r2.fieldChecksum,
  stateEqual: r1.stateHash === r2.stateHash,
  zoneCounts: r1.zones.reduce((a: any, z) => (a[z] = (a[z] ?? 0) + 1, a), {}),
  dispositions: r1.dispositions.reduce((a: any, z) => (a[z] = (a[z] ?? 0) + 1, a), {}),
  first20: r1.zones.slice(0, 20).join(''),
};
console.log(JSON.stringify(out, null, 1));
