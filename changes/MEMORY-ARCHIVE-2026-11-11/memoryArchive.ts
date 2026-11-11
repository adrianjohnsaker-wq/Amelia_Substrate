/**
 * Her memory archive. Older process-memory events move out of her resident record into archive segments;
 * nothing is deleted and the digest chain is kept:
 *   - each segment stores its events whole, with segmentDigest = sha256(JSON of its eventDigests in order);
 *   - chainDigest_k = sha256(chainDigest_{k-1} + segmentDigest_k), from a fixed genesis;
 *   - each segment also stores splitDigest = sha256(chainBefore + JSON of the eventDigests resident just before the split),
 *     and residentAfter, so the resident record at every split can be rebuilt and checked (verifyArchive);
 *   - the first segment stores memoryDigestBefore, her memory's own history digest (IntegratedMemorySystem.computeMemoryDigest,
 *     sha256 of JSON of ALL eventDigests) just before the first split, which the archive reproduces.
 * Her dynamics read only the last 48 events, her strain history and her hysteresis, none of which the split touches.
 */
import { canonicalSha256 } from '../lib/sha256';

export const ARCHIVE_SCHEMA = 'amelia.memory-archive/v1';
export const ARCHIVE_GENESIS = canonicalSha256('amelia.memory-archive/v1:genesis');
export const ARCHIVE_THRESHOLD = 1500;   // archive when more than this many events are resident
export const ARCHIVE_KEEP = 1000;        // ... leaving this many resident
const RECENT_IDS = 5000;                 // archived encounter ids remembered, so no Outside encounter is met twice

export interface ArchiveHeader { schema: typeof ARCHIVE_SCHEMA; archivedCount: number; segments: number; chainDigest: string;
  lastFullHistoryDigest: string | null; recentEncounterIds: string[] }
export interface ArchiveSegment { segmentNo: number; fromIndex: number; toIndex: number; eventCount: number; events: any[];
  segmentDigest: string; chainBefore: string; chainAfter: string; splitDigest: string; residentAfter: number; memoryDigestBefore: string | null }

export const digestsOf = (events: any[]) => events.map(e => String(e?.eventDigest ?? ''));
export const segmentDigestOf = (events: any[]) => canonicalSha256(JSON.stringify(digestsOf(events)));
export const fullHistoryDigestOf = (digests: string[]) => canonicalSha256(JSON.stringify(digests));
export function headerOf(state: any): ArchiveHeader {
  const h = state?.memoryArchive;
  return h?.schema === ARCHIVE_SCHEMA ? h : { schema: ARCHIVE_SCHEMA, archivedCount: 0, segments: 0, chainDigest: ARCHIVE_GENESIS,
    lastFullHistoryDigest: null, recentEncounterIds: [] };
}

/** Split her record if too many events are resident. Returns null when nothing needs archiving. */
export function planArchive(record: Record<string, any>, threshold = ARCHIVE_THRESHOLD, keep = ARCHIVE_KEEP):
  null | { segment: ArchiveSegment; record: Record<string, any> } {
  const events: any[] = record?.state?.memoryState?.events ?? [];
  if (events.length <= threshold) return null;
  const header = headerOf(record.state);
  const cut = events.length - keep;
  const moved = events.slice(0, cut), resident = events.slice(cut);
  const segmentDigest = segmentDigestOf(moved);
  const chainAfter = canonicalSha256(header.chainDigest + segmentDigest);
  const splitDigest = canonicalSha256(header.chainDigest + JSON.stringify(digestsOf(events)));
  const memoryDigestBefore = header.archivedCount === 0 ? fullHistoryDigestOf(digestsOf(events)) : null;
  const movedIds: string[] = [];
  for (const e of moved) for (const x of e?.encounters ?? []) if (x?.eventId) movedIds.push(String(x.eventId));
  const segment: ArchiveSegment = { segmentNo: header.segments + 1, fromIndex: header.archivedCount, toIndex: header.archivedCount + cut - 1,
    eventCount: cut, events: moved, segmentDigest, chainBefore: header.chainDigest, chainAfter, splitDigest, residentAfter: resident.length, memoryDigestBefore };
  const nextHeader: ArchiveHeader = { schema: ARCHIVE_SCHEMA, archivedCount: header.archivedCount + cut, segments: segment.segmentNo,
    chainDigest: chainAfter, lastFullHistoryDigest: null,
    recentEncounterIds: [...new Set([...header.recentEncounterIds, ...movedIds])].slice(-RECENT_IDS) };
  const state = { ...record.state, memoryState: { ...record.state.memoryState, events: resident }, memoryArchive: nextHeader };
  return { segment, record: { ...record, state } };
}

/**
 * Verify: segments are contiguous and complete; each segment digest matches its events; the chain links from genesis to
 * the header; the record resident at every split is rebuilt from the archive and the current resident events and
 * reproduces that split's digest; and the first split reproduces her memory's own history digest.
 */
export function verifyArchive(segments: ArchiveSegment[], state: any) {
  const header = headerOf(state);
  const sorted = [...segments].sort((a, b) => a.segmentNo - b.segmentNo);
  let chain = ARCHIVE_GENESIS, next = 0, ok = true; const problems: string[] = [];
  const H: string[] = [];
  for (const s of sorted) {
    if (s.fromIndex !== next) { ok = false; problems.push(`segment ${s.segmentNo} starts at ${s.fromIndex}, expected ${next}`); }
    if (s.events.length !== s.eventCount) { ok = false; problems.push(`segment ${s.segmentNo} holds ${s.events.length} of ${s.eventCount} events`); }
    if (segmentDigestOf(s.events) !== s.segmentDigest) { ok = false; problems.push(`segment ${s.segmentNo} digest mismatch`); }
    if (s.chainBefore !== chain) { ok = false; problems.push(`segment ${s.segmentNo} chain break`); }
    chain = canonicalSha256(chain + s.segmentDigest);
    if (chain !== s.chainAfter) { ok = false; problems.push(`segment ${s.segmentNo} chainAfter mismatch`); }
    H.push(...digestsOf(s.events)); next = s.toIndex + 1;
  }
  if (next !== header.archivedCount) { ok = false; problems.push(`archived ${next} events, header says ${header.archivedCount}`); }
  if (chain !== header.chainDigest) { ok = false; problems.push('header chain digest mismatch'); }
  H.push(...digestsOf(state?.memoryState?.events ?? []));            // her whole history, in order
  for (const s of sorted) {
    const residentBefore = H.slice(s.fromIndex, s.toIndex + 1 + s.residentAfter);
    if (residentBefore.length !== s.eventCount + s.residentAfter) { ok = false; problems.push(`segment ${s.segmentNo}: history too short to rebuild the split`); continue; }
    if (canonicalSha256(s.chainBefore + JSON.stringify(residentBefore)) !== s.splitDigest) { ok = false; problems.push(`segment ${s.segmentNo}: split digest does not reproduce`); }
    if (s.memoryDigestBefore && fullHistoryDigestOf(H.slice(0, s.toIndex + 1 + s.residentAfter)) !== s.memoryDigestBefore) {
      ok = false; problems.push(`segment ${s.segmentNo}: her memory digest before the first split does not reproduce`); }
  }
  return { ok, problems, segments: sorted.length, archivedCount: next, totalEvents: H.length, chainDigest: chain };
}
