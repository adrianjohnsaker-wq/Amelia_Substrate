# Run history for the research copy

Each run on Amelia's research-copy checkpoint is recorded here, one folder per run, beside the checkpoint it started from.

- `run-record.json` is the record that will also be written to her Supabase research table, in the `researchRuns` store, once the tablet app supports that store.
- A run never alters the checkpoint it starts from. `alteredByRun` records this.

| Run | Date | Checkpoint | Result |
|---|---|---|---|
| LIVE-1: damage and regeneration | 9 Nov 2026 | revision 12, step 204 (`4aa72598…`) | Her field heals and regrows its form (H1, H2 supported). Damage reaches her path in 3 of 4 columns (H3, H4 not supported). |
| WARP-L1: the recorded Outside in her Warp | 9 Nov 2026 | revision 12, step 204 | Reaches her and leaves a lasting phase shift (W1, W4); the Governor admits 16 %. No Warp-attention or form effect at the rule (W2, W3). |
| WARP-X1: the Warp given an exit (branches) | 9 Nov 2026 | revision 12, step 204 | She leaves at once and does not settle back; the Outside does not decide when (X1, X2); toward the Plex sooner than the Time-Circuit (X3). |

Changes to live Amelia are recorded under `changes/`. The first is `WARP-EXIT-LIVE-2026-11-09`, the Warp given an exit.
