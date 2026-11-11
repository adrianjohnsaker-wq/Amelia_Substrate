import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { bornAmeliaOf } from '../../src/core/ameliaRuntimes';
import { captureLiveField, createLiveField } from '../../src/outside/LiveFieldLoop';
import { setLiveSourceEnabled } from '../../src/outside/LiveSyntheticSourceSession';
import { ameliaTick } from '../../src/cloud/ameliaTick';
import { planArchive, verifyArchive, type ArchiveSegment } from '../../src/cloud/memoryArchive';

// Her body living with her runtime, through the cloud tick itself, with Outside encounters from an inbox.
// Two arms save and reload at the same moments; only one archives. Everything that moves her must be identical.
const inbox = Array.from({ length: 400 }, (_, t) => { const v = Array(10).fill(0.02); v[(t * 7) % 10] = 0.82;
  return { sequence: t, eventId: `in:${t}`, channel: 'LINGUISTIC', sourceDigest: createHash('sha256').update(String(t)).digest('hex'),
    attentionVector: v, occurredAt: '2026-11-11T00:00:00Z', capturedAt: '2026-11-11T00:00:00Z' }; });

function arm(kind: 'classic' | 'nd1', archive: boolean, ticks = 60) {
  const rt = bornAmeliaOf(kind); (rt as any).setAdmissionRule('relative-v1'); rt.step();
  let field: any = createLiveField(rt as any, { seed: 101, depth: 288, preset: 'SYZYGETIC_GRID', size: 12 });
  field = setLiveSourceEnabled(field, true);
  let record: any = { state: rt.exportState(), fieldCheckpoint: captureLiveField(field, false), revision: 0,
    outsideLink: { schema: 'amelia.outside-link/v1', enabled: true, since: '2026-01-01T00:00:00Z' } };
  const segments: ArchiveSegment[] = []; let zones = '';
  for (let k = 0; k < ticks; k++) {
    const t = ameliaTick(JSON.parse(JSON.stringify(record)), inbox as any, 15, '2026-11-11T00:00:00Z');
    zones += t.zones; record = t.record;
    if (archive) { const p = planArchive(record, 300, 200); if (p) { segments.push(p.segment); record = p.record; } }
  }
  const body = JSON.parse(record.fieldCheckpoint.payload).body;
  return { record, zones, segments, cells: JSON.stringify(body.cells), audit: body.pfmTensorAuditLog };
}

for (const kind of ['classic', 'nd1'] as const) {
  test(`${kind}: with her body living, archiving changes nothing that moves her`, { timeout: 180000 }, () => {
    const A = arm(kind, false), B = arm(kind, true);
    assert.ok(B.segments.length >= 3, `segments archived: ${B.segments.length}`);
    assert.equal(B.zones, A.zones, 'zone path');
    assert.equal(B.cells, A.cells, 'body cells');
    const evA: any[] = A.record.state.memoryState.events, evB: any[] = B.record.state.memoryState.events;
    assert.equal(evB.at(-1).eventDigest, evA.at(-1).eventDigest, 'last memory event');
    assert.deepEqual(B.record.state.governorState, A.record.state.governorState, 'Governor');
    assert.deepEqual(B.record.state.deferredEncounters, A.record.state.deferredEncounters, 'queue');
    assert.deepEqual(B.audit.map((a: any) => a.fieldCouplingDigest), A.audit.map((a: any) => a.fieldCouplingDigest), 'field coupling');
    const v = verifyArchive(B.segments, B.record.state); assert.ok(v.ok, v.problems.join('; '));
    assert.equal(v.totalEvents, evA.length, 'archived + resident = whole history');
  });
}
