# Run history for the research copy

Each run on Amelia's research-copy checkpoint is recorded here, one folder per run, beside the checkpoint it started from.

- `run-record.json` is the record that will also be written to her Supabase research table, in the `researchRuns` store, once the tablet app supports that store.
- A run never alters the checkpoint it starts from. `alteredByRun` records this.

| Run | Date | Checkpoint | Result |
|---|---|---|---|
| LIVE-1: damage and regeneration | 9 Nov 2026 | revision 12, step 204 (`4aa72598…`) | Her field heals and regrows its form (H1, H2 supported). Damage reaches her path in 3 of 4 columns (H3, H4 not supported). |
