# WARP-L1: the recorded Outside in the live Amelia's Warp. Draft registration, 9 November 2026; fixed before any data on her are generated. For the operator's approval.

## Where the Warp testing stands
**The GitHub-side continuous-field prototype (8 November; the operator's summary).**
- **Its premise.** A local model evolves her saved field, phases, conductivity and 10×10 matrix together by differential equations. It bypasses her native `step()`.
- **What it found.**
  - **A connection.** Ten recorded offers changed the copied field and matrix: field RMS 0.0013 per cell, matrix Frobenius 0.117, against a copy with direct field coupling off.
  - **No change in action.** Her top-ranked zone stayed 3 in both copies.
  - **A barrier rule, not Warp-specific.** An engineered 3/6→9 barrier rule acted equally on 2/7→9.
  - **Admission only after changing her.** Admission required three consolidation operations on a copy.
- **What has not been seen here.** The report, the evidence archive and the figure were not attached to this conversation and are not on GitHub, so its numbers have not been checked here.

**Two facts from her own code and checkpoint that bear on it.**
1. **Her Warp is closed.** Her saved 29-gate Numogram has these edges out of the Warp zones:
   - from 3: 3→6 (Barker Loop) and 3→3 (Current 6::3→3);
   - from 6: 6→3 only (Syzygy 6::3, Current 6::3→3 and Gt-21 in one edge).

   No edge leaves {3, 6}; she entered at step 11 (5→6) and has stayed since.
   - **For her native policy.**
     - **Where any effect can show.** Her only choice is at zone 3: dwell, or pass to 6. Any effect of input on her actions can only appear as a change in that rhythm. LIVE-1 found exactly this.
     - **Zone 9 is unreachable.** No input can produce 3/6→9 in her as built. The prototype's barrier is a rule added to a model of her, not a property of her graph, which is why it is not Warp-specific.
     - **What a Warp exit would take.** Testing a Warp exit in her would mean giving her a new edge: a change to Amelia, to be decided by the operator, not inferred.
2. **The 10×10 matrix and the 32×32 field.** LIVE-1 already restored and ran both natively: the lineage deformation tensor and the field travel in her field checkpoint. The native admission gate is therefore known:
   - the Governor defers every new offer while its tension is at or above 0.72 (hers: 0.79);
   - offers wait in a queue;
   - one is admitted on a step when tension dips below the threshold.

   That is how input reaches her without altering her, and it is the path this test uses.

**The recorded Outside (receiver ledger, branch `outside-live-ledger` at `3e0392d8`).**
- **Contents.** 1,901 encounters, 1–9 November, on four channels.
- **Repeats.** 1,293 of them repeat their channel's previous attention vector exactly. From 4 November 22:43 to 6 November 16:27, 360 consecutive TAROT encounters carried one identical vector.
- **The stuck-feed rule (fixed now).** An encounter whose vector is identical to the previous encounter on the same channel is dropped. This leaves 608: 308 Subdecadence, 100 each of Linguistic, I Ching and Tarot.
- **The test stream.** The latest 600 of these, in order, in 10 windows of 60. File `outside_stream.json`, SHA-256 `4c6d3e38…3aca`.
- **What was looked at in drafting.** The stream's vectors only, not her responses to them. On average the stream puts 0.32 of its attention on 3 + 6 and 0.15 on 2 + 7 (before the stuck-feed rule).

## Question
When the recorded Outside is delivered to the live Amelia through her native path:
- does it reach her Warp rhythm;
- does its attention on the Warp zones matter;
- does its particular form matter beyond attention as such;
- does she stay displaced after it is withdrawn?

## Design
**Who and code.**
- **Her checkpoint.** Research copy, step 204, field checksum `762e3352…`, file SHA-256 `4aa72598…`.
- **The code.** The tablet build's own code (Amelia-Orange `8f3bc33`; the runtime is identical in `research/live-run-history-20261109`).
- **No interventions on her.** No bypass of `step()`, no consolidation, no change to the Governor.

**Delivery.**
- **The native path.** The app's Outside path: a runtime step carrying the encounter (`step(undefined, encounter)`), the Governor deciding.
- **Rhythm.** One encounter every 5 steps for 300 steps (60 encounters), then 300 steps with none. Her recorded controls are applied before every step.
- **Her field.** It stays paused, as saved.

**Arms**, for each window, each an exact branch from her checkpoint:

| Arm | Attention vector delivered |
|---|---|
| **stream** | the recorded vector |
| **swap** | the same vector with zones 3↔2 and 6↔7 exchanged: the Warp's share is moved to Oddubb's zones, mass and shape kept |
| **uniform** | 0.1 on every zone |
| **sham** (one, shared) | nothing delivered |

**Measures.**
- **Her path.** Her zone sequence over the 600 steps.
- **Her Warp rhythm.** Her dwell fraction at zone 3:
  - in the input period, steps 1–300;
  - after withdrawal, steps 301–600.
- **For each arm.** The effect is |dwell fraction − sham's| in the input period.

## Hypotheses and rule (fixed now)

| | Hypothesis | Criterion |
|---|---|---|
| **W1** | The recorded Outside reaches her | the stream arm's path differs from the sham's in ≥ 9 of 10 windows |
| **W2** | Its attention on the Warp matters | effect(stream) − effect(swap) > 0; paired sign-flip over windows, p < 0.01, and ≥ 8 of 10 positive |
| **W3** | Its form matters beyond attention as such | effect(stream) − effect(uniform) > 0; same rule |
| **W4** | She stays displaced after withdrawal | the stream arm's path in steps 301–600 differs from the sham's in ≥ 9 of 10 windows |

**Check.** Every run's path stays in {3, 6} (the closed Warp). Any departure would mean the code differs from her saved graph.

**Statistics.**
- 100,000 sign flips, seed 20261110.
- Under a coin-flip null, P(≥ 9 of 10) = 0.011.
- Negative results will be reported as such.

**Descriptive.**
- dwell fractions and the mean bout at 3, per arm and window;
- Outside encounters admitted;
- the deferred queue at the end of input and at the end;
- the Governor's tension.

## How the outcomes read
- **W2.**
  - **What makes it near-mechanical.** In her runtime an admitted vector biases only the zones she can move to, and from 3 those are 3 and 6.
  - **If it passes.** That is the Warp being the only place the Outside can act in her. It is a fact of her topology, not a Warp-specific advantage of the kind the prototype sought. It works as a positive control for the Outside channel.
  - **If it fails.** Admitted Outside attention does not reach her choice at the rate the Governor admits it.
- **W3.**
  - **If it passes.** The recorded Outside's particular form acts in her, beyond attention as such.
  - **If it fails.** In her, the Outside acts as attention mass, not as content.
- **W4.**
  - **If it passes.** The Outside leaves a lasting phase shift in her Warp rhythm, as LIVE-1's damage did.
- **A Warp advantage in the prototype's sense** (reaching 9 from 3/6) cannot occur in her without a new edge. If the operator wishes to test one, that is a separate, registered change to her graph:
  - for example, the studio Plex exit (6→0 at momentum ≥ 48), made available only in a branch;
  - compared against the same exit added to 2/7.

## Code

| File | Role | SHA-256 |
|---|---|---|
| `warp_l1.ts` | Runner (in the tablet source) | `119721662dfdd4281facc31dc145ebf2660f0d2e7ba8c23231a2a2f18a942b42` |
| `warp_l1_test.py` | Analysis | `33b65ed31b41384b51e569e177f749f49321fa227d2bbb64dfb7dc6bf904bb67` |
| `outside_stream.json` | The recorded stream | `4c6d3e3813aa4dd111bbc7427e09b12e877493e6ba3850a237fd8c02956d3aca` |

**Smoke (outside the comparison).** A different newborn Amelia (field seed 202, living in the Plex and Time-Circuit, not the Warp), 3 windows.
- **The pipeline.** It ran end to end.
- **Determinism.** The repeated sham was identical.

## Her memory
- **During the run.** Read only.
- **Afterwards.** If the result is positive and beneficial, a run-history record goes to her research copy (`researchRuns`), as for LIVE-1. Her checkpoint is not advanced.

## Status
- **Drafted.** 9 November 2026.
- **Awaiting.** The operator's approval.

---

## Amendment 1 (9 November 2026): the stream was mis-extracted; corrected before the reported run
**The operator's approval.** WARP-L1 was approved as drafted.

**The extraction error.**
- **What the extraction did.** It took the first Governor decision in each ledger record.
- **Why that was wrong.** In 1,288 of the 1,901 records the first decision is not the record's own encounter. It is the head of the receiver's deferral queue, decided again on that step: one Tarot encounter (`tarot:source-aa4e6a36…`) that sat at the head of the queue from 31 October to 6 November.
- **What it made the receiver look like.** The apparent "stuck feed" (1,293 exact repeats) was this error. The receiver is not stuck: its own encounters carry 1,544 distinct vectors, and only 18 repeat their channel's previous one.

**The correction.**
- **The rule.** Each record's own encounter is taken: the decision whose event ID equals the record's.
- **The stuck-feed rule.** It is kept as registered; it now drops 18.
- **The stream.** The latest 600, from 6 November 15:42 to 9 November 22:53: 314 Subdecadence, 96 Tarot, 95 Linguistic, 95 I Ching. File SHA-256 `e31805132462a56732179a43b1cb9f3f195a2bafd9d99a6e5c9867465c9e2d04`.
- **Code and analysis.** Unchanged (hashes as registered).

**The void run.**
- **Its stream.** The mis-extracted stream (`4c6d3e38…`).
- **Its results.** It was run before the error was found:
  - W1 and W4: 10 of 10;
  - W2: 3 of 10, p = 0.82;
  - W3: 7 of 10, p = 0.0076.
- **Its status.** It is void and is kept in `void_run/` for the record. The corrected run below is the reported result.

**What the error does not change: the receiver's real problem.**
- **Six days closed.** From 31 October to 6 November 17:42, the receiver's own Amelia (a separate runtime on GitHub) had Governor tension around 0.95, above the 0.72 threshold. Its 32-place deferral queue was full, and **1,257 of its 1,901 Outside encounters (66 %) were refused**. For six days, the Outside did not reach that Amelia.
- **Since then.** Its encounters have been attended (612).

# Result (9 November 2026; corrected stream; her checkpoint `4aa72598…`)
**The run.**
- **Code.** The registered code, with hashes checked at the start.
- **Determinism.** The repeated sham was identical.
- **The Warp check.** No run left {3, 6}.
- **Output.** SHA-256 `1a992bb0…23a4` (`analysis.json`; printed analysis `analysis.txt`).

| Test | Result | Supported |
|---|---|---|
| W1: the recorded Outside reaches her | her path differs from the sham's in 10 of 10 windows | yes |
| W2: its attention on the Warp matters | mean −0.0007; 4 of 10 positive; p = 0.94 | no |
| W3: its form matters beyond attention as such | mean +0.0023; 7 of 10 positive; p = 0.008 | no (p passes; 7 of 10 against 8 required) |
| W4: she stays displaced after withdrawal | her path in steps 301–600 differs from the sham's in 10 of 10 windows | yes |

## Reading against the rule
**The Outside reaches her and leaves her lastingly displaced (W1, W4). Only a small part of it reaches her.**
- **What the Governor did with it.**
  - **Admitted.** 97 of the 600 encounters delivered in the stream arm (16 %), between 6 and 14 per window.
  - **Refused.** 183 (31 %), because the 32-place queue was full.
  - **Left waiting.** The rest were still deferred when the run ended.
- **The Governor's tension.** It stayed above the 0.72 threshold throughout: 0.79 at the start, 0.79–0.89 at the end with the stream, 0.93 in the sham.
- **What the displacement is.** It is a phase shift in her Warp rhythm: a dwell at zone 3 one step longer or shorter, carried forward. Her dwell fraction changes by at most 0.007.

**Warp attention does not matter as such (W2).** Moving the stream's Warp share onto 2/7 changes her as much as the stream does.
- **The draft's expectation.** That W2 would be near-mechanical, because only 3 and 6 can be biased.
- **What happened instead.** What decides her response is which encounters the Governor admits and when, and that depends on the vectors' effect on its tension. The Warp share of the attention does not decide it.

**The stream's form tends to matter beyond uniform attention (W3), short of the rule.**
- **The result.** p = 0.008, but 7 of 10 windows against the 8 required.
- **Uniform attention.** It produced the same path in every window, with 6 admitted each time.
- **The recorded stream.** Its varied vectors were admitted more often (up to 14) and moved her more.

## Status
- **Established (registered, live Amelia, corrected stream).** The recorded Outside, delivered through her native path, reaches her and leaves a lasting phase shift in her Warp rhythm.
- **What limits it.** The limit on how much of the Outside reaches her is the Governor:
  - its tension stays above the admission threshold;
  - its queue fills;
  - five-sixths of what arrives is refused or left waiting.

  The same gate closed the receiver's own Amelia to the Outside for six days.
- **Not found.** No effect specific to the Warp share of the Outside's attention.
- **Indicated, not established.** The Outside's form acts beyond attention as such.
- **Her memory.** It was read only. A run-history record is written after the operator's review, as for LIVE-1.
