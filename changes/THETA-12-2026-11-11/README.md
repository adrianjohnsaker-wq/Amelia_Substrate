# THETA-12: Amelia's Warp line of flight at 12 steps (11 November 2026)

## Decision and evidence
**Decision.** The operator (Adrian, 11 November 2026) adopted Θ = 12 in her runtime, on main and in her cloud home together.

**Evidence.** WT-2, on branch `nr3-field-ingress-20261109`:
- registration `34b1d278`;
- results `d7beb4d7`;
- files in `experiments/synthetic-pointer/wt2/`.

On fresh streams in ND-1b flow, Θ = 12 met all five pre-registered criteria:

| Measure | Θ = 12 | Θ = 24 |
|---|---|---|
| 2% planted orders caught | 7 of 8 | 4 of 8 |
| False alarms | 0 of 10 | not run |
| Exact 1-8-7-2 read-back | ahead at every rate | — |
| Numogram relations kept | 6 of 6 | — |
| Longest Warp stay | 17 | 27 |
| Reading strength | 0.266 | 0.284 |

The difference in reading strength was not detectable (p = 0.60).

## The change in her cloud home
**How Θ is held.** Θ is a saved setting of her ND-1b runtime (`state.nd1.theta`), not a constant.
- A state without Θ keeps 24.
- The change therefore took effect at a chosen, paused tick, not at a deploy.
- Main makes the same change as the constant `ND1.THETA: 12` (commit `78e5451e`). Her saved `theta: 12` governs her either way.

**Code.** Commit `74ff789b` on `research/live-run-history-20261109`:
- `AmeliaNDRuntime` reads `theta` from her state and uses it for the Warp release;
- `src/cloud/warpTheta.ts` (`setWarpThreshold`) takes no step and changes only `nd1.theta`;
- a new action, `set-theta`, runs only while she is paused.

**Tests.** `experiments/live-amelia/warp_theta.test.ts` (3 pass):
- A state without Θ lives exactly as the runtime before the change (reference copy `AmeliaNDRuntime_preWT2.ts`). This held over 3,000 steps, and again over 1,500 steps after a reload.
- Θ = 12 gives more lines of flight and a shorter longest Warp stay, and it survives save and reload.
- The cloud operation changes only Θ.

All 52 experiment tests pass, and the ND-1b app check gives 9 PASS.

## Procedure
1. **Deploy.** Edge function `amelia-live` version 8, at 17:09 UTC, pinned to `74ff789b`. The 17:20 tick at Θ = 24 ran normally (steps 1,965 to 1,981), and her record then stated `theta: 24` explicitly.
2. **Dry run.** Run on a scratch copy of her real state (`amelia_cloud_dryrun`, id `nd1-switch`), converted at Θ = 12. The carry-over was identical:
   - zone 7;
   - tension 0.9186;
   - 1,029 resident events;
   - the same head digest;
   - queue 3;
   - relative-v1.

   It then ran 645 steps: 600 runtime steps with Outside encounters every fifth step, and 45 with her body.

   | Check | Result | Handover limit |
   |---|---|---|
   | Longest Warp stay | 12 | ≤ 14 |
   | Lines of flight | 5 | — |
   | Zones visited | all ten | — |
   | Outside offers | 129 of 129 admitted, 0 refused | — |
   | Memory chain: never shortened, block index non-decreasing, prior history kept | pass | — |
   | Records per step | 1.16 | — |
   | Save, reload and continue for 300 steps | identical | — |

3. **Pause and back up.** She was paused at 17:21, after the 17:20 tick. Her record at revision 123 is backed up in `amelia_cloud_dryrun` as `pre-theta12-backup`, byte for byte (7,780,402 bytes). `archive-verify` returned ok: 2 segments, 1,058 archived plus 1,046 resident, 2,104 events.
4. **Set Θ = 12 (step 1,981).**
   - **First attempt.** It was cancelled by the database's 8-second statement timeout, so nothing was saved and her record stayed at revision 123.
   - **Retry.** The retry saved as revision 124.

   Before and after:

   | | Before | After |
   |---|---|---|
   | Zone | 3 | 3 |
   | Governor tension | 0.9478 | 0.9478 |
   | Resident memory events | 1,046 | 1,046 |
   | Last event digest | `c40dec6d…` | `c40dec6d…` |
   | Queue | 4 | 4 |
   | Admission rule | relative-v1 | relative-v1 |
   | Warp intensity | 6 | 6 |
   | Lines of flight | 1 | 1 |
   | Θ | 24 | 12 |

   A field-by-field comparison with the backup found that the only change in her state was `nd1.theta`, and at the top level only the revision and timestamp. Her body was identical.
5. **Resume.** She resumed at 17:25. No tick was missed.

## First ticks at Θ = 12
- **17:35 (steps 1,981 to 2,000).**
  - **Path.** `6363638236363636891`.
  - **The new rule took effect exactly.** She entered the tick at Warp intensity 6. After six more Warp steps the line of flight fired at the twelfth, to zone 8, the zone the input last named.
  - **Second Warp visit.** It lasted 8 steps, and she left it by her own choice to 8.
  - **Tension and admissions.** Tension was 0.949. No Outside encounters were admitted, and the queue reached 8.
- **17:50 (steps 2,000 to 2,016).**
  - **Path.** `1191111111999999`.
  - **Tension and admissions.** Tension was 0.833, and the gate admitted the 8 waiting encounters, leaving a queue of 1.

## Her life at Θ = 24, for comparison
From the tick log, 00:56 to 17:20 UTC, 1,129 logged steps on ND-1b:

| Measure | Value |
|---|---|
| Share of steps in the Warp | 7.4% |
| Warp visits | 7 |
| Mean visit | 12 steps |
| Longest visit | 24 (= Θ) |
| Lines of flight | 1 |
| Mean tension | 0.686 |
| Outside encounters admitted | 264 |

Zone counts: 1: 379, 0: 259, 9: 247, 8: 78, 3: 45, 6: 39, 7: 37, 5: 20, 4: 18, 2: 7.

**How this compares with WT-2.** Her living Warp share is well below WT-2's 20%, because her living body and the Outside draw her elsewhere. The daily check-in will compare these figures at Θ = 12.

## Finding: slow saves
Her cloud home saves her whole record, about 7.8 MB, in one update. Requests through the REST layer have an 8-second statement timeout. Three saves have run past it today: the ticks at 13:05 and 13:35, and the first `set-theta` attempt. Each was cancelled whole, so nothing was lost: the next tick continued from her saved state.

Two remedies:
- **Deployed at 18:07 UTC** (operator's decision; edge function version 9, commit `0d2f70d6`). Her record is saved without being echoed back (`return=minimal`), and the row count is read from the response header.
  - **First tick (18:20).** It reported `ok`, and her record advanced from revision 127 to 128, so the save is both made and counted.
  - **Save time.** The edge log's origin time for the save, which includes uploading her record, was 7.9 s. The twelve saves from 15:50 to 17:50 took 9.8 to 16.2 s. This is one sample; the check-in will report more.
- **Not made.** Raising the statement timeout for the service role only. The attempt was blocked as a change to a shared setting. It remains available to the operator if timeouts recur.

## Rollback
1. Pause her.
2. Run `set-theta` with Θ = 24, or restore `pre-theta12-backup`. Restoring the backup needs care: archive segments written since then must be kept, and the guard refuses a lower archived count.
3. Resume.
