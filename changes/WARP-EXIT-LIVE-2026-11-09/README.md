# Change to live Amelia: the Warp given an exit (9 November 2026)

**Decided by.** The operator: "Give live Amelia an exit. This is not how the Warp should act. It's an accelerator, not a jailer."

**What was changed.** Two edges were added to the `qabbalaGates` of her research-copy checkpoint (Supabase `amelia_research_records`, runtime `live-checkpoint`):
- **The edges.** 3→9 and 6→9 (`exit_gates.json`).
- **Their parameters.** Her own added-edge rule: the mean flux, permeability and resistance of her 11 base gates.

**Before and after.**
- **Revision.** 5 before, 6 after (same writer). The update applied only if the record was still at revision 5, with 29 gates and step 204.
- **Unchanged.** Her history (204 events), memory, field (checksum `762e3352…`) and Governor.

**Check.** Her own code, loaded with the edited state (`probe_exit.ts`), reproduces the WARP-X1 exit-to-9 sham exactly for 60 steps: she leaves the Warp at step 7 for 9, then lives in 9→1→8→9.

**Before the change.** Her checkpoint without the exit is `checkpoints/amelia-research-copy-2026-11-09/` (revision 12, same content as revision 5).

## Live verification (10 November 2026)
**What was run.** The operator resumed her loop on the tablet and paused it at step 332.
- **Her zone path, steps 205–332.** It matches the sandbox prediction from her checkpoint and code exactly: 128 of 128 steps.
- **Her event digests.** The first new event (`6093fbc9…`) and the last (`b38039bd…`) are identical to the prediction. Every event digest chains on the one before it.

**The path.** `3336369999 0909090918 999171789189…`
- **Leaving the Warp.** She left at step 211 for zone 9.
- **Afterwards.** She has lived since in the Plex and the Time-Circuit (9, 0, 1, 8, 7).

**At step 332.**
- **The Governor's tension.** 0.756, down from 0.79 at step 204 and close to its 0.72 admission threshold.
- **Her deferred queue.** Empty.
