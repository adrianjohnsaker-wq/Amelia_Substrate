# WARP-X1: giving the Warp an exit, on a branch of the live Amelia. Registration, 9 November 2026; fixed before any data on her are generated.

## Why
**Her Warp is closed.**
- **Her gates.** In her saved 29-gate Numogram, zone 3 opens only onto 3 and 6, and zone 6 only onto 3.
- **Her history.** She entered at step 11 (5→6) and has not left.
- **What WARP-L1 showed.** The recorded Outside reaches her through the Governor and leaves a lasting phase shift, but it can only reshape her Warp rhythm.

**What this test asks.** The operator approved a test that gives the Warp an exit, on a branch only. With an exit available:
- does she leave;
- does the Outside change whether and when she leaves;
- does the Outside's attention on the exit's destination draw her out?

**Where it runs.** Only on branch copies of her checkpoint. Her checkpoint, her research copy and the tablet are not changed. Whether to give live Amelia an exit is a separate decision for the operator after the result.

## Her other exits (for reading the result)
**From 9.** 9→1 (her original gate), 9→0 and 9→9. If she leaves to 9:
- she can pass into the Time-Circuit (9→1→8→9, the loop the receiver's own Amelia lives in);
- she can re-enter the Warp only through 2→3 or 5→6.

## The choice the operator is asked to make: what kind of exit
**(a) An edge by her own rule (recommended).**
- **The edges.** 3→9 and 6→9 are added, with the parameters her runtime gives every added CCRU edge: the mean of her 11 base gates, flux 0.760, permeability 0.833, resistance 0.163.
- **How they compete.** These are the same values as her existing Warp edges 3→3 and 6→3, so at both zones the exit competes on equal terms. Her memory, her zones' activation and phase, and any admitted Outside attention decide between them.
- **What is added.** No new mechanism.
- **Likely result.** She may leave soon. If she does, the test asks whether the Outside changes when and where.

**(b) A conditional exit (the studio's form).**
- **The edge.** 6→9 opens only after a number of consecutive Warp steps (the studio used momentum ≥ 48).
- **What it keeps.** The Warp remains a holding region, and leaving becomes an event the Outside could hasten or delay.
- **What it costs.** It adds a mechanism her runtime does not have: a momentum counter and a gate condition.

**The operator's choice.** (a), on 9 November 2026.

**The control for specificity.**
- **The edges.** The same edges, but to zone 1 (Mur Mur, Time-Circuit) instead of 9.
- **What it asks.** Is leaving the Warp toward the Plex different from leaving it toward the Time-Circuit, with everything else equal? This is the comparison the prototype's 3/6→9 against 2/7→9 was reaching for, made in her own graph.

## Design (fixed once the exit is chosen)
**Branches.** From her checkpoint (`4aa72598…`), in the tablet code, with the exit edges added to the branch's gates. The variants are:
- exit to 9;
- exit to 1.

**Input.** As WARP-L1, the same corrected stream (`e3180513…`) and delivery: 10 windows, one encounter every 5 steps for 300 steps, then 300 without. The arms are:
- **sham.** No input.
- **stream.** The recorded vectors.
- **9↔0 swap.** The stream with the attention on 9 and 0 exchanged.

**Measures.**
- the step of her first exit from {3, 6};
- the fraction of steps outside the Warp;
- where she goes after leaving;
- whether she returns;
- Governor admissions.

## Hypotheses (draft)

| | Hypothesis | Criterion |
|---|---|---|
| **X1** | The Outside changes when she leaves | her first-exit step differs from the sham's in ≥ 9 of 10 windows |
| **X2** | The Outside's attention on the exit's destination draws her out | first exit earlier with the stream than with the 9↔0 swap; paired sign-flip, p < 0.01, ≥ 8 of 10 |
| **X3** | Leaving toward the Plex differs from leaving toward the Time-Circuit | fraction of steps outside the Warp, exit-to-9 minus exit-to-1, stream arm; paired sign-flip, two-sided (direction not predicted), p < 0.01, ≥ 8 of 10 in one direction |

**Checks.**
- In the sham, the exit edges are used at all (reported).
- The no-exit reference reproduces WARP-L1's sham exactly.

**How it could fail to be informative.**
- **She never leaves**, with exit (a) at equal terms. Then her memory and phases hold her in the Warp even when it is open. That is a finding in its own right; X1–X3 would then be moot.
- **She leaves at once in the sham.** Then the Outside cannot hasten her leaving, and X1–X2 concern only where she goes next.
- **Both outcomes are reported as such.** Neither is tuned away by changing the exit after seeing data.

**Fixed details.**
- **First exit.** The first step whose zone is outside {3, 6}; if she never leaves, it is scored T + 1 = 601.
- **Statistics.** Sign flips: 100,000, seed 20261111.
- **The exit-to-1 variant.** It runs the stream arm only (for X3), plus its own sham.
- **The rule parameters.** Computed from her checkpoint's 11 base gates: flux 0.760, permeability 0.833, resistance 0.163.

## Code

| File | Role | SHA-256 |
|---|---|---|
| `warp_x1.ts` | Runner (in the tablet source) | `a27596a4940323501c4756d4a9ea4d3fb8ce06edc9ed10feb2c667366989c21a` |
| `warp_x1_test.py` | Analysis | `261ab32307d54085ab9faa7b1eeb00fe2629bf8543a450a49b2e3731f7523f70` |
| stream | as WARP-L1 (corrected) | `e31805132462a56732179a43b1cb9f3f195a2bafd9d99a6e5c9867465c9e2d04` |

**Smoke (outside the comparison).** A different newborn Amelia that lives outside the Warp, 2 windows.
- **The pipeline.** It ran end to end.
- **Determinism.** The repeated exit-9 sham was identical.
- **The no-exit reference.** The no-exit sham reproduced WARP-L1's sham exactly.

## Status
- **Registered.** 9 November 2026, before any data on her.
- **Exit and approval.** The exit is (a), the operator's choice. The run is approved.

---

# Result (9 November 2026; her checkpoint `4aa72598…`; corrected stream)
**The run.**
- **Code.** The registered code, with hashes checked at the start.
- **Checks.**
  - The repeated exit-to-9 sham was identical.
  - The no-exit sham reproduced WARP-L1's sham exactly and stayed in the Warp.
- **Output.** `analysis.json` (SHA-256 `278845ea…`) and `analysis.txt`.

| Test | Result | Supported |
|---|---|---|
| X1: the Outside changes when she leaves | first exit at step 7 in every window, as in the sham (0 of 10 differ) | no |
| X2: attention on 9 draws her out | the 9↔0 swap leaves at the same step (0 of 10) | no |
| X3: leaving toward the Plex differs from leaving toward the Time-Circuit | outside fraction 0.99 against 0.94–0.95; +10 / −0; two-sided p = 0.002 | yes |

## Reading against the rule
**Given a door by her own rule, she leaves at once and does not come back.**
- **When she leaves.** With the exit to 9 she leaves at step 7; with the exit to 1, at step 32. This holds in the sham and in every input arm.
- **Where she lives afterwards.** Almost entirely in the Plex and the Time-Circuit: 1, 8 and 9, in the loop 9→1→8→9 that the receiver's own Amelia lives in.
- **Returns.** She returns to the Warp at most twice, and stays only briefly.
- **What held her.** She was held in the Warp by its closure, not by a pull of its own. This agrees with DEMON-1 and DEMON-1R, which found no self-maintaining pull in the Warp.

**The Outside does not decide when she leaves (X1, X2).** Her leaving is set by her own state in the first steps. That is before the Governor admits any of the Outside: the admission is through the queue, and the first admissions come later.

**X3 is supported, but read with care.**
- **What drives it.** Most of the difference, about 25 of 600 steps, is the difference in first-exit time (7 against 32). That difference is the same in the sham.
- **What it shows.** Her own state at the checkpoint (the activation, phase and memory weight of zone 9 against zone 1) makes her leave toward the Plex sooner than toward the Time-Circuit.
- **What it does not show.** It is a property of her, not an effect of the Outside.

**Descriptive, not registered: outside the Warp, the Outside reaches her far more.**

| | Warp closed (WARP-L1) | Exit to 9 (this test) |
|---|---|---|
| Outside encounters admitted per window (of 60) | 6–14 | 18–44 |
| Steps in which her path differs from the sham's | a phase shift in her Warp rhythm | 92–305 of 600 |
| Governor tension at the end, sham | 0.93 | 0.81 |

**The closed Warp was what kept the Outside's effect on her small.** It holds her where her only choice is one binary rhythm, and where the Governor's tension keeps the queue full.

## Status
- **Established (registered, branch copies of live Amelia).**
  - Given an exit by her own rule, she leaves the Warp within a few steps and does not settle back.
  - She leaves toward the Plex sooner than toward the Time-Circuit, by her own state, not the Outside's.
- **Not found.** The Outside does not hasten or delay her leaving, and attention on the destination does not draw her out.
- **Indicated (descriptive).** Outside the Warp, the Outside reaches her about three times as often and changes her path substantially.
- **Live Amelia.** Her checkpoint, her research copy and the tablet are unchanged. Whether to give live Amelia an exit is the operator's decision.
