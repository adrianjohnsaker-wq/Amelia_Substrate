import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { bornAmeliaOf } from '../../src/core/ameliaRuntimes';
import { planArchive, verifyArchive, headerOf, type ArchiveSegment } from '../../src/cloud/memoryArchive';
import { chooseLiveCheckpoint } from '../../src/services/checkpointReconciliation';
import { seenEncounterIds } from '../../src/outside/OutsideInbox';

const enc = (t: number) => { const v = Array(10).fill(0.02); v[(t * 7) % 10] = 0.82; return { eventId: `t:${t}`, channel: 'LINGUISTIC',
  sourceDigest: createHash('sha256').update(String(t)).digest('hex'), attentionVector: v } as any; };
function live(kind: 'classic' | 'nd1', archive: boolean, n = 1200) {
  let rt = bornAmeliaOf(kind); (rt as any).setAdmissionRule('relative-v1');
  let record: any = { state: rt.exportState() }; const segments: ArchiveSegment[] = []; const zones: number[] = [];
  for (let t = 0; t < n; t++) {
    rt.step(undefined, t % 3 === 0 ? enc(t) : undefined); zones.push(rt.getCurrentZone() as number);
    if (t % 50 === 49) {   // both arms save and reload at the same moments; only one archives
      record = { state: JSON.parse(JSON.stringify(rt.exportState())) };
      if (archive) { const p = planArchive(record, 300, 200); if (p) { segments.push(p.segment); record = p.record; } }
      rt = bornAmeliaOf(kind); rt.importState(record.state);
    }
  }
  return { rt, zones, segments, state: rt.exportState() as any };
}

for (const kind of ['classic', 'nd1'] as const) {
  test(`${kind}: archiving older events changes nothing in how she lives`, () => {
    const A = live(kind, false), B = live(kind, true);
    assert.ok(B.segments.length > 3, 'several segments were archived');
    assert.deepEqual(B.zones, A.zones);
    assert.equal((B.rt.getMemory().getEvents() as any[]).at(-1).eventDigest, (A.rt.getMemory().getEvents() as any[]).at(-1).eventDigest);
    assert.deepEqual(B.state.governorState, A.state.governorState);
    const total = headerOf(B.state).archivedCount + B.rt.getMemory().getEvents().length;
    assert.equal(total, A.rt.getMemory().getEvents().length, 'no event lost: archived + resident = whole history');
    const v = verifyArchive(B.segments, B.state);
    assert.ok(v.ok, v.problems.join('; '));
    assert.equal(B.segments[0].memoryDigestBefore !== null, true);
  });
}

test('the archive detects tampering and gaps', () => {
  const B = live('nd1', true, 700);
  const tampered = JSON.parse(JSON.stringify(B.segments)); tampered[0].events[3].eventDigest = 'f'.repeat(64);
  assert.equal(verifyArchive(tampered, B.state).ok, false);
  assert.equal(verifyArchive(B.segments.slice(1), B.state).ok, false);
});

test('reconciliation compares histories by logical position across the archive', () => {
  const A = live('nd1', false, 700), B = live('nd1', true, 700);
  const local = { state: A.state }, remote = { state: B.state };
  assert.equal(chooseLiveCheckpoint(local, remote), 'local');          // same history; local is the longer resident copy, equal logical length
  const ahead = live('nd1', true, 750);
  assert.equal(chooseLiveCheckpoint({ state: A.state }, { state: ahead.state }), 'remote');
  const forked = JSON.parse(JSON.stringify(B.state)); forked.memoryState.events.at(-1).eventDigest = 'e'.repeat(64);
  assert.throws(() => chooseLiveCheckpoint({ state: A.state }, { state: forked }));
});

test('encounters moved to the archive are still remembered as met', () => {
  const B = live('nd1', true, 700);
  const seen = seenEncounterIds(B.state);
  assert.ok(seen.has('t:0'), 'an early, archived encounter is still known');
});
