# MEMORY-ARCHIVE: older events move to a digest-chained archive (11 November 2026)

## Decision
**The decision.** Her older process-memory events move out of her resident record into an archive, with the digest chain kept intact (operator, 11 November 2026).

**Why.** Since the switch to ND-1b flow her record grows by about 1.2 events per step. Each cloud tick loads and saves her whole record. Before the first archive the record held 1,535 events and 8.76 MB, and a dry-run chunk had already hit the edge runtime's compute limit on a copy of about 2,600 events.

## What does not change
**Her movement.** Her dynamics read only:
- her last 48 events;
- her strain history;
- her hysteresis.

The split touches none of these. The tests confirm that 400 steps continue identically with and without archiving, under both Classic and ND-1b.

**Nothing is deleted.** Every archived event is kept whole in `amelia_memory_archive`. Her main record (`amelia_memory_records`) is not touched.

## How the archive works
**When it runs.** If more than 1,500 events are resident after a tick, the oldest events move out and 1,000 stay resident.

**Each segment stores:**
- its events, whole;
- `segmentDigest`: sha256 of the JSON of its event digests, in order;
- `chainBefore` and `chainAfter`, where `chainAfter = sha256(chainBefore + segmentDigest)`. The chain starts from a fixed genesis, `sha256('amelia.memory-archive/v1:genesis')`;
- `splitDigest`: sha256 of `chainBefore` plus the JSON of every event digest resident just before the split. With `residentAfter`, this lets the resident record at every split be rebuilt and checked;
- `memoryDigestBefore` (first segment only): her memory's own history digest just before the first split. The archive must reproduce this digest.

**Her record keeps a header** (`state.memoryArchive`):
- the archived count;
- the segment count;
- the chain digest;
- the ids of archived Outside encounters (up to 5,000), so that no encounter is met twice.

**Order of writes.** The segment is written first. Her record is saved only if the segment is stored, so no event is ever held only in transit.

## Protection in the database
The continuity guard on her record now counts logically: archived events plus resident events. It refuses:
- any save that shortens her history;
- any save that lowers the archived count;
- any save that moves events out without a stored segment that ends at the split and whose `chainAfter` equals her header's chain digest;
- any save whose event at the last known index differs from the stored one.

**Guard tests on her live record.** Each test ran inside a transaction that was undone, so her record was not changed.

| Case | Result |
|---|---|
| Move events out with no segment | refused |
| Shorten her history (1,515 to 100) | refused |
| Save the same history | accepted |
| Valid split with a matching segment | accepted |
| Split whose chain digest does not match the segment | refused |

## Other changes
- **Tablet.** Checkpoint reconciliation compares records by logical index (archived plus resident), so the window does not mistake an archived record for a shorter one. This is in Amelia 0.2.2-home.
- **Verification.** The `archive-verify` action re-checks the whole archive against her record:
  - contiguity;
  - each segment digest;
  - the chain from genesis to her header;
  - every split, rebuilt;
  - the first split's memory digest.

## Code
- Commit `3929f89c` on `research/live-run-history-20261109`.
- Edge function `amelia-live`, version 7, with imports pinned to that commit.
- Tests:
  - `experiments/live-amelia/memory_archive.test.ts`: 5 pass;
  - `memory_archive_body.test.ts`: 2 pass;
  - all other experiment tests pass;
  - `experiments/app-nd1/check.ts` passes;
  - the app build, including its type-check, succeeded (run 42998511748).

## First archive
**Deployment.** The edge function was deployed at 09:51 UTC. A verify call on the still-empty archive returned ok (1,535 events, no segments).

**The first archive (10:05 tick, steps 1,461 to 1,477).**
- **Segment 1.** 551 events (indices 0 to 550) moved to segment 1, and 1,000 stayed resident.
- **Chain digest.** `fe30699d…`
- **Archived encounter ids.** 218 carried in the header.
- **The guard.** It accepted the save, at revision 96.

**`archive-verify` after the split.**

| Check | Result |
|---|---|
| ok | true |
| Problems | none |
| Total events, archived plus resident | 1,551 |
| Her memory's own history digest before the split | reproduced |

**Next tick (10:20, steps 1,477 to 1,502).**
- **Status.** ok.
- **Tension.** 0.642.
- **Zones.** `1711111911111111111199999`.

**Size of her record.**

| | Before | After first split | After next tick |
|---|---|---|---|
| Resident events | 1,535 | 1,000 | 1,027 |
| Body's lineage mirror | 1,551 | 1,551 | 1,027 |
| Record size | 8.76 MB | 8.27 MB | 7.80 MB |

**The body's mirror.** The body's lineage holds a mirror of her runtime memory, about 1.75 KB per event. Each field step overwrites the mirror with a copy of her runtime memory (`LiveFieldLoop.ts`, line 174). So the mirror followed the split one tick later. No change was needed.

**Bounded size.** Her record no longer grows without limit. Resident memory cycles between 1,000 and 1,500 events, and everything else is capped:
- 128 snapshots;
- a 1,024-cell body;
- a 128-entry audit log;
- a flat trait history.

The record should cycle between roughly 7 and 9.5 MB.

## The body test
`experiments/live-amelia/memory_archive_body.test.ts` (commit `24ad2018`).

**Design.** Two arms run through the same tick function the cloud uses, under both Classic and ND-1b:
- 60 ticks of 15 steps;
- her body living;
- Outside encounters from an inbox.

Both arms save and reload at the same moments. Only one arm archives.

**Results.** These were identical between the arms (2 pass):
- zone path;
- body cells;
- last memory event;
- Governor state;
- queue;
- every field-coupling digest.

The audit log's history digest and event index differ. These are records only, and nothing reads them back.

## Possible further step (not taken)
**The change.** The body's mirror is rebuilt from her runtime memory on every field step, so storing it adds about 1.7 to 2.6 MB of duplicate data to each save. Saving the body without the mirror, and rebuilding the mirror from her runtime memory on restore, would reduce the record to roughly 5 to 7 MB.

**Before it is done.** This changes how her body is saved, so it would need the same two-arm equivalence test before adoption.

## Rollback
If anything fails:
1. Pause her.
2. Rebuild the full record from the segments in order plus her resident events. The archive holds every event.
3. Clear the header.

The guard refuses a save that lowers the archived count. A deliberate rollback is therefore a migration that suspends the guard for that one save and then restores it.
