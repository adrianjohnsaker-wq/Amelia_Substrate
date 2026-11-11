import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { withFullNumogram } from '../../src/core/fullNumogram';
import { AmeliaNDRuntime } from '../../src/outside/AmeliaNDRuntime';
import { setWarpThreshold } from '../../src/cloud/warpTheta';

const enc = (t: number) => { const v = Array(10).fill(0.02); v[(t * 7) % 10] = 0.82; return { eventId: `t:${t}`, channel: 'LINGUISTIC',
  sourceDigest: createHash('sha256').update(String(t)).digest('hex'), attentionVector: v } as any; };
const WARP = new Set([3, 6]);
function walk(rt: any, n: number, from = 0) {
  let path = '', run = 0, longest = 0;
  for (let t = from; t < from + n; t++) { rt.step(undefined, t % 4 === 0 ? enc(t) : undefined); const z = rt.getCurrentZone();
    path += z; run = WARP.has(z) ? run + 1 : 0; longest = Math.max(longest, run); }
  return { path, longest, last: (rt.getMemory().getEvents() as any[]).at(-1).eventDigest, flights: rt.getNDStatus().flights };
}
const born = (C: any) => { const r: any = withFullNumogram(new C()); r.setAdmissionRule('relative-v1'); return r; };

test('a state without Θ lives exactly as before the change (Θ = 24)', async () => {
  const { AmeliaNDRuntime: Old } = await import('../../src/outside/AmeliaNDRuntime_preWT2');
  const a = born(Old), b = born(AmeliaNDRuntime);
  const A = walk(a, 3000), B = walk(b, 3000);
  assert.equal(B.path, A.path); assert.equal(B.last, A.last); assert.ok(A.flights > 0, 'lines of flight occurred');
  // and from a saved state that has no theta (as hers did), after reload
  const s: any = JSON.parse(JSON.stringify(a.exportState())); delete s.nd1?.theta;
  const a2 = born(Old), b2 = born(AmeliaNDRuntime); a2.importState(s); b2.importState(s);
  assert.equal(b2.getWarpTheta(), 24);
  assert.equal(walk(b2, 1500, 3000).path, walk(a2, 1500, 3000).path);
});

test('Θ = 12 survives save and reload and shortens her Warp passage', () => {
  const r24 = born(AmeliaNDRuntime), r12 = born(AmeliaNDRuntime); r12.setWarpTheta(12);
  const A = walk(r24, 4000), B = walk(r12, 4000);
  assert.ok(B.flights > A.flights, `more lines of flight at 12: ${B.flights} vs ${A.flights}`);
  assert.ok(B.longest < A.longest, `shorter longest stay: ${B.longest} vs ${A.longest}`);
  const s = JSON.parse(JSON.stringify(r12.exportState())); const r = born(AmeliaNDRuntime); r.importState(s);
  assert.equal(r.getWarpTheta(), 12);
  assert.equal(walk(r, 800, 4000).path, walk(r12, 800, 4000).path, 'reload continues identically');
});

test('the cloud operation changes only Θ and carries everything else across', () => {
  const r = born(AmeliaNDRuntime); walk(r, 600);
  const record = { state: JSON.parse(JSON.stringify(r.exportState())), revision: 7, fieldCheckpoint: { x: 1 } };
  const out = setWarpThreshold(record, 12, '2026-11-11T12:00:00Z', 'test');
  assert.equal(out.before.theta, 24); assert.equal(out.after.theta, 12);
  const strip = (s: any) => JSON.stringify({ ...s, nd1: { ...s.nd1, theta: undefined } });
  assert.equal(strip(out.record.state), strip(record.state));
  assert.deepEqual(out.record.fieldCheckpoint, record.fieldCheckpoint); assert.equal(out.record.revision, 8);
  assert.throws(() => setWarpThreshold(record, 0, '', 'test'));
});
