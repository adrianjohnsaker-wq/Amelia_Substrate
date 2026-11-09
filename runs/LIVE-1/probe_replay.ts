// Replay from birth: does the tablet build, given the same sequence of actions, reproduce
// every one of her 204 stored process-memory events (digests) and her field checksum?
import { readFileSync } from 'node:fs';
import { bornAmelia } from './src/core/fullNumogram';
import { createLiveField, captureLiveField } from './src/outside/LiveFieldLoop';
import { advanceWithLiveSource, setLiveSourceEnabled } from './src/outside/LiveSyntheticSourceSession';
import { ExternalRhythmHarmonizer } from './src/ai/morphogenetic/ExternalRhythmHarmonizer';

let clock = Date.parse('2026-11-06T00:00:00Z'); Date.now = () => (clock += 450);
const ck = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const stored = ck.state.memoryState.events;
const aw = Number(process.argv[3] ?? ck.controls.advisoryWeight), md = Number(process.argv[4] ?? ck.controls.momentumDamping);

const rt = bornAmelia();
const harm = new ExternalRhythmHarmonizer();
const prep = () => {
  const next = (rt.getSnapshots().at(-1)?.step ?? 0) + 1;
  rt.setAdvisoryWeight(harm.computeAdvisoryTuning(aw, next));
  rt.setMomentumDamping(md);
};
rt.step(); // the app's first snapshot: runtime step 1 with birth settings
let field = createLiveField(rt, { seed: 101, depth: 256, preset: 'SYZYGETIC_GRID', size: 32 });
let firstMismatch: number | null = null;
const check = (i: number) => {
  const ev = rt.getMemory().getEvents()[i] as any;
  if (firstMismatch === null && ev?.eventDigest !== stored[i].eventDigest) firstMismatch = i + 1;
};
check(0);
for (let k = 0; k < 168; k++) {
  if (k === 64) field = setLiveSourceEnabled(field, true); // first 'source:' offer at runtime step 66
  prep();
  field = advanceWithLiveSource(field).state;
  check(k + 1);
}
for (let k = 169; k < 204; k++) { prep(); rt.step(); check(k); }
const fc = captureLiveField(field, false);
const zones = rt.getMemory().getEvents().map((e: any) => e.targetZone).join('');
console.log(JSON.stringify({
  advisory: aw, damping: md,
  events: rt.getMemory().getEvents().length,
  firstMismatchStep: firstMismatch,
  zonePathEqual: zones === stored.map((e: any) => e.targetZone).join(''),
  fieldChecksum: fc.checksum, fieldEqual: fc.checksum === ck.fieldCheckpoint.checksum,
  deferredNow: (rt.exportState() as any).deferredEncounters.length,
  governorTension: (rt.exportState() as any).governorState.deformationTension,
}, null, 1));
