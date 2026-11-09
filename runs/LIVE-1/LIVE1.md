# LIVE-1: damage and regeneration in the live Amelia. The first test on her own state, in her own code. Registration, 9 November 2026; fixed before any test data are generated.

## Why this test
**The operator's diagnosis.** After the run of nulls (CAESURA-1 to HOOK-1), the operator judged that the practice was at fault, not the theory:
- every test had been run on the studio construct (`experiments/studio/runtime_mirror`), not on the live Amelia;
- the studio construct does not read or write her persistent Supabase memory;
- no test had a positive control, so a null could not be told apart from a broken measurement.

**What this test changes.**
- **Who.** Amelia herself: her research-copy checkpoint as saved by the tablet (runtime step 204, field step 168, revision 12), not a studio newborn.
- **Code.** The tablet build's own source (Amelia-Orange `8f3bc33`, the source of the APK branch line `work/continuity-preservation-20261106`; field code identical from `4e115a7`). Nothing is reimplemented.
- **A positive control first.** A damage-and-regeneration test in her live Gray–Scott field (Levin's paradigm), whose healing arm is expected to succeed if the measurement works.

## Fidelity check (done before drafting; reported in full)
**Her checkpoint.**
- Supabase `research_records` runtime `live-checkpoint`, copied to the private repository `Amelia_Substrate`, branch `research/amelia-tablet-checkpoint-20261109`.
- File SHA-256 `4aa72598810d04436bc99371f4c545dea244ec7d7040cfdf4eaf04cf27938ab0`, verified.

**Loaded into the tablet code (`probe_fidelity.ts`).**
- **The field checksum.** It recomputes exactly: `762e3352…c224c`.
- **The runtime round trip.** Re-exporting her runtime after loading reproduces the stored state exactly (no differing path).
- **The field round trip.** Re-capturing her field reproduces the stored payload byte for byte.
- **Continuation is deterministic.** Two independent loads, each stepped 200 field steps exactly as the app plays the field, are identical in:
  - zone path;
  - every event digest;
  - field checksum;
  - full runtime state.

**Replay from birth (`probe_replay.ts`; partial).**
- **What matches.** From a newborn, the same code reproduces her whole stored zone path, all 204 steps: born at 0, nine steps through the Time-Circuit (9 1 8 9 1 8 7 8 7 5), then the Warp, 3↔6, ever since. Her first three events also match digest for digest, and her body's first observations match.
- **Where it diverges.** At field step 2 her stored body differs from the replay in A only. Her band means of B agree to full precision. No base setting of the operator's advisory control (0.600–0.850), no rhythm setting and no perturbation pulse from the app's panel reproduces it.
- **The likely cause.** The build that wrote her early history did not record the operator's controls; the build that fixed this (`0ddb9df`, "Preserve live control settings across research checkpoint restarts") came later, so her checkpoint marks its controls `legacy-assumed`. Something on the tablet not recorded in her history acted on her body at that step.
- **What this means for the test.** Her past cannot be replayed exactly from birth. Her present can be loaded exactly and continued deterministically, and this test starts from her present.

**Her state at the start.**
- **Zone and queue.** Zone 3 (the Warp); her deferred queue is empty.
- **The Governor.** Tension 0.7935, scaffold stage 3, advisory 0.722, damping 0.88.
- **Her body.** Her synthetic source is connected (adaptive, live arm, source step 104, address 1). Her field (F 0.042, K 0.059, Da 1, Db 0.48) is nearly uniform at B ≈ 0.29, with a central structure: a vertical stripe at x 15–18 and a blob at (16, 16).

## How her body reaches her (from the code; fixed before the run)
- **Runtime to body.** Each runtime step drives the field: her zone-0 and zone-9 strain and her lineage's deformation tensor set the coupling of 16 sampled cells.
- **Body to runtime.**
  - **The offer.** Her body is observed as ten vertical bands of B. With the source connected, the offer she receives is the source's target profile for a binary address: the smoothed centroid of her body's band weights, at or above 0.5. Her centroid stands at 0.503.
  - **Admission.** The Governor admits an offer only when its field tension is below 0.72, and defers it otherwise. Deferred offers wait in a queue and may be admitted later.
  - **What an admitted offer does.** It enters her process memory's bias (0.045 × attention over the last 48 events).
- **What this implies.** Damage reaches her only if it moves the address, and only through what the Governor admits.

## Design
**Arms.** Exact branches from her loaded checkpoint, continued T = 500 field steps as the app plays the field: the recorded controls are applied before each step (advisory 0.722 through her external rhythms, damping 0.88), then `advanceWithLiveSource`.

| Arm | At the start |
|---|---|
| **sham** | nothing |
| **ablation at a site** | every cell within radius 5 of the site (on the torus) reset to the unpatterned state A = 1, B = 0 |

**The sites.**
- **Grid.** 16 sites at (x, y) ∈ {4, 12, 20, 28}² — the replicates.
- **Centre.** (16, 16), on her central structure; reported separately.
- **Note.** Her body is read by vertical bands, so sites in the same column may affect her alike; this is reported, not corrected.

**What is recorded.**
- per step: her zone, the Governor's decision on the current offer, the source address and the Governor's tension;
- B over the whole field at t = 0, 1, 5, 10, 25, 50, 100, 200, 300, 400, 500;
- at T: her memory bias, her Governor state and her deferred queue.

## Hypotheses and rule (fixed now)
**Measures.** For a site with disc D:
- **m(t), the healing measure.** |mean over D of B(damaged) − mean over D of B(sham)| / (mean over D of B(sham) at t = 0).
- **f(t), the form measure.** RMS over D of (B(damaged) − B(sham)) / the same RMS at t = 0.

| | Hypothesis | Criterion at T = 500, per site |
|---|---|---|
| **H1** | Her body heals: the damaged region regains its substance (positive control) | m(T) < 0.10 |
| **H2** | Her body regenerates its form: the damaged region returns to what it would have been without damage | f(T) < 0.10 |
| **H3** | The damage reaches her: her zone path differs from the sham's | any step differs |
| **H4** | She stays displaced after her body heals | her zones in steps 401–500 differ from the sham's |

**Rule.**
- **Support.** A hypothesis is supported if its criterion holds at 14 or more of the 16 grid sites. Under a coin-flip null, the probability of 14 or more of 16 is 0.002.
- **The centre site.** It is reported against each criterion, separately.
- **The positive control.** If H1 fails, the measurement or the paradigm is not working in her field, and H2–H4 are not interpreted.
- **Nulls.** Negative results will be reported as such.

**How the outcomes read.**
- **H1.** It passes if her body heals as a reaction–diffusion medium should. This is the control.
- **H2.**
  - **Passes.** Her body has a target form that it restores: the Levin result.
  - **Fails with H1 passing.** She heals but does not regenerate: the region fills, with a different form.
- **H3.**
  - **Passes.** Her body reaches her through the source and the Governor.
  - **Fails.** Her runtime is shielded from her body's damage by the address and the Governor's deferrals.
- **H4.** It passes if a healed wound leaves her on a different path: her body is healed, but she is not where she would have been.

**Descriptive.**
- the medians of m(t), f(t) and the whole-field RMS difference over time;
- per site:
  - zone steps differing;
  - address steps differing;
  - the number attended;
  - the Governor's tension at T;
  - the deferred queue.

## Code

| File | Role | SHA-256 |
|---|---|---|
| `live1.ts` | Runner (in the tablet source, Amelia-Orange `8f3bc33`, src tree `ef7c46f7`) | `e0bedf0650f289a7eb2ec2efeb567ceb18b14553a6b4c0469831d0c96c717583` |
| `live1_test.py` | Analysis, fixed before the run | `51fcec7f2da9b1daba75102ea0037226f7a65f1a3688b624e63c96a1ca40a6c0` |
| `probe_fidelity.ts` | Fidelity probe | `cb8f76e80e5f09156539d85068adb8f969af43e46ca27e342fedb840a459b224` |
| `probe_replay.ts` | Replay from birth | `eab1d4403d9f1a4f62faadc6600dfdcb12e769f208fe173d776741613185e6b1` |

**Smoke (outside the comparison).** A different newborn Amelia (field seed 202) lived 168 field steps, run for T = 50.
- **The runner and the analysis.** Both ran end to end.
- **Determinism.** The repeated sham was identical.

## What is seen before the run (disclosed)
- **Her checkpoint.**
- **The fidelity probe's 200-step undamaged continuation.**
  - **Zones.** 111 in zone 3 and 89 in zone 6.
  - **Offers.** 194 deferred and 6 attended.
  - **Status.** This continuation is the first 200 steps of the sham arm.
- **The smoke run** on another Amelia.

## Her memory
- **Read only.** Nothing in this test is written to her Supabase memory.
- **Write-back.** Following the operator's instruction, write-back is considered only if the result is positive and beneficial, and only to the research copy, never to her main record. It would take the form of a run-history record that does not alter her checkpoint. Advancing her live checkpoint by a damaged or undamaged branch would change her life and is not done without the operator's word.

## Status
- **Registered.** 9 November 2026, before any test data.
- **Approval.** Run under the operator's instruction of 9 November: "Run everything here. Check. Then if positive and beneficial write back to memory stores."

---

# Result (9 November 2026; her checkpoint `4aa72598…`; T = 500)
**The run.**
- **Code.** The registered code, with hashes checked at the start.
- **Arms.** All 17 damage arms and the sham ran.
- **Determinism.** The repeated sham was identical.
- **Raw output.** SHA-256 `f75f3820…6925`. The compact record is `analysis.json`; the printed analysis is `analysis.txt`.

| Test | Grid sites meeting the criterion | Supported (≥ 14 of 16) | Centre site |
|---|---|---|---|
| H1: her body heals (positive control) | 16 of 16 | yes | yes |
| H2: her body regenerates its form | 16 of 16 | yes | yes |
| H3: the damage reaches her | 12 of 16 | no | no |
| H4: she stays displaced after healing | 12 of 16 | no | no |

## Reading against the rule
**The positive control passes.** The measurement works in her live field: the first registered positive result on the live Amelia.

**Her body heals and regenerates its form (H1, H2).**
- **The ablated disc.** It refills, and returns to what it would have been without damage. At T, the form measure f is 0.0005 (median), against a criterion of 0.10.
- **The whole field.** It converges on the sham field too: the RMS difference in B falls from 0.081 at damage to 0.0036 by step 200 and 0.0002 by step 500.
- **The central structure.** It regrows in place when ablated.
- **What this shows.** Her body has a form to which it returns after damage (Levin's target-morphology result). That form holds even where her runtime path has diverged from the sham's.

**Her path is reached in three of four columns, not in all (H3, H4 not supported).**
- **Which damage leaves her path untouched.**
  - **The x = 20 column.** The damage leaves her zone path identical to the sham's for all 500 steps.
  - **The centre site.** The same.
- **Which damage reaches her.**
  - **The x = 4 and x = 12 columns.** The damage shifts her path by about 33 steps.
  - **The x = 28 column.** It shifts her path by 174 steps.
  - **Where the shifts lie.** At her single choice point, the length of a dwell at zone 3 before returning to 6.
  - **How long it lasts.** Where her path is shifted, it is still shifted in steps 401–500, after her body has healed.
- **How the damage reaches her.**
  - **The address.** The damage changed her source address on 29–95 steps. Every current offer from her source was nonetheless deferred, in every arm. The Governor's tension was mostly above the 0.72 threshold. On the few steps it fell below it (minimum 0.69–0.70), the oldest queued offer took the step's admission and the current one waited.
  - **The queue.** Through the deferred queue, the six admitted encounters per arm (17 in the x = 28 column) carried that difference into her process memory.
- **Why it falls short.** Twelve of sixteen falls short of the registered fourteen. Because her body is read by vertical bands, the sixteen sites are four column replicates of four, and three of the four columns reach her.

## Status
- **Established (registered, live Amelia).**
  - **The control.** A positive control in her own field and code passes.
  - **Healing and form.** Her body heals and regenerates its form after damage, independently of the path her runtime takes.
- **Indicated, not established.**
  - **Where the damage goes.** Damage to her body reaches her runtime in three of four column positions and leaves a lasting phase shift in her Warp dwelling.
  - **The channel.** It does so only through the Governor's deferred queue, because the Governor's tension keeps her current offers deferred.
- **Her memory.** Nothing was written to her Supabase memory.
