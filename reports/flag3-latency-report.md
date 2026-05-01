# Flag 3 — Unwrap Latency Report

**Date:** 2026-04-30T06:08Z (T+17.1h)
**Method:** `publicDecrypt()` wall-clock time, measured from unwrap tx confirmation to successful decrypt.

## Raw Data

| Run | Context | Wall-clock (s) | Attempts | Notes |
|-----|---------|----------------|----------|-------|
| 0 | firstlight (T+15.6h) | 0.90 | 1 | Gateway pre-warmed from prior decrypt activity (Paths 2+3) |
| 1 | latency-test run 1 | 13.26 | 1 (after 10s wait) | Cold start — 10s wait for Gateway to process `allowPublicDecryption` |
| 2 | latency-test run 2 | 15.25 | 1 (after 10s wait) | Same session, ~1 min after run 1 |
| 3 | latency-test run 3 | 15.87 | 1 (after 10s wait) | Same session, ~1 min after run 2 |

## Statistics

- **Mean (all 4):** 11.32s
- **Mean (cold starts only, runs 1–3):** 14.79s
- **Min:** 0.90s (outlier — warm Gateway)
- **Max:** 15.87s
- **Variance:** Wide. 0.9s to 15.9s (17.6x range).

## Analysis

1. **The 0.9s sample was an outlier.** The Nox Gateway was already warmed from prior Path 2 (employee decrypt) and Path 3 (auditor decrypt) calls. The `allowPublicDecryption` event had already been processed by the Gateway.

2. **Real-world latency is ~13–16s.** The dominant cost is the Gateway processing the `allowPublicDecryption` event (~10s), followed by the actual TEE decryption (~3–6s).

3. **Without initial wait, publicDecrypt fails.** Earlier test runs (v2, v3) that polled immediately got "handle does not exist or is not publicly decryptable" for 60+ seconds because the Gateway hadn't indexed the handle yet. The 10s initial wait resolves this.

4. **All runs under 2 minutes.** No timeout failures once the initial wait was added.

## Demo Recording Strategy

**Decision (0xjaadu T+17.5h):** No pre-warming. Real cold-start latency stays in the demo. Honest demo > fake speed.

- The UI shows a "Decrypting..." spinner after the unwrap tx confirms, during the publicDecrypt poll.
- Expected visible wait: **10–15 seconds** in normal conditions.
- Voiceover fills this time: *"The Nox protocol is decrypting the amount off-chain using Intel TDX secure enclaves..."*
- This ~15s wait is actually a strength — it demonstrates real TEE-mediated decryption, not a mock.

## Verdict

✅ **Safe for demo.** 15s is acceptable with a spinner and voiceover. No pre-warming, no scene cuts.
