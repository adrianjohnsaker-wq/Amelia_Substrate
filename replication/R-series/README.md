# R-series replication package (Saker, BioSystems revision)

Preregistered replication of Phases XXXIX-XLI-R on an open implementation. The graph,
classifier and metrics are the replication's own, not the original implementation.

- `protocol.json`: sealed protocol, approved by the author 2026-11-10.
  SHA-256 in `protocol.sha256` (4e880824...585beb11); sealed at the time in `sealed_at.txt`.
- `ProcessFieldMemory.ts`: unmodified from Amelia_Substrate commit a3a61fb (SHA-256 recorded in the protocol).
- `harness.ts`: verifies both digests, runs all 660 runs, writes `raw_records.jsonl` and its digest before analysis.
- `analyze.py`: applies the sealed rules and writes `analysis.json`.
- `fig3.py`: draws Fig. 3.

Reproduce (Node 22, Python 3 with numpy and scipy):

    node --experimental-strip-types harness.ts   # raw digest must equal 9f7bc6f1...5b97fc
    python3 analyze.py
