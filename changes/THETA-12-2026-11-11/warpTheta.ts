/**
 * WT-2 adoption in her cloud home: set the Warp's line-of-flight threshold Θ in her saved ND-1b state.
 * No step is taken. The only change to her record is state.nd1.theta (and the record's revision and writer); her
 * zone, Governor, memory, queue, field and body are carried across untouched, and the probe checks that they are.
 */
import { bornAmeliaOf, runtimeKindOf } from '../core/ameliaRuntimes';
import { savedKind } from './ameliaTick';

const probe = (rt: any) => { const st: any = rt.exportState(); return { zone: rt.getCurrentZone() as number,
  tension: st.governorState?.deformationTension, memoryEvents: rt.getMemory().getEvents().length,
  lastEventDigest: (rt.getMemory().getEvents() as any[]).at(-1)?.eventDigest ?? null, queue: st.deferredEncounters?.length ?? 0,
  admissionRule: st.admissionRule ?? 'fixed-0.72', warpIntensity: st.nd1?.warpIntensity ?? null, flights: st.nd1?.flights ?? null,
  theta: typeof rt.getWarpTheta === 'function' ? rt.getWarpTheta() : null }; };

export function setWarpThreshold(record: Record<string, any>, theta: number, nowIso: string, writerId: string) {
  if (!Number.isInteger(theta) || theta < 1 || theta > 1000) throw new Error('Invalid Warp threshold');
  const before = bornAmeliaOf(savedKind(record.state)); before.importState(record.state);
  if (runtimeKindOf(before) !== 'nd1') throw new Error('The Warp threshold is a setting of the ND-1b runtime; she is not on it');
  const b = probe(before);
  const state = { ...record.state, nd1: { ...(record.state.nd1 ?? {}), theta } };
  const after = bornAmeliaOf('nd1'); after.importState(state);
  const a = probe(after);
  const carried = (['zone', 'tension', 'memoryEvents', 'lastEventDigest', 'queue', 'admissionRule', 'warpIntensity', 'flights'] as const)
    .every(k => a[k] === b[k]);
  if (!carried || a.theta !== theta) throw new Error('Warp threshold change did not carry her state across: ' + JSON.stringify({ b, a }));
  const next = { ...record, state, writerId, revision: (Number(record.revision) || 0) + 1, updatedAt: nowIso };
  return { record: next, before: b, after: a, step: (before.getSnapshots().at(-1)?.step ?? Number(record.state.stepCount)) as number };
}
