# Recorded computation adapters

The audience exporter accepts a directory of JSON files, one per `.m2` program. For `name.json`, keep the executable source at `code/name.m2` in the authoring deck.

Required fields: `version`, `output` (the actual process transcript), and `result_tex` (the verified result). Recommended: `recorded_at` (ISO UTC) and `source_sha256`. Keep the transcript verbatim; do not synthesize interactive prompts or claim a new run when displaying saved data.

The conic example additionally emits a `[Conic powers]` / `[/Conic powers]` block containing a JSON array of five records, each with `power`, `tex`, and `transcript`. These become the T through T⁵ buttons, with pre-rendered formulas and raw output. The code download is read-only; no solver is contacted by the audience.

For custom engines, build a static viewer that reads bundled results. Keep the inputs, engine version, numerical limitations, and result counts. Remove live connection fields and compute buttons from the released viewer, rather than leaving controls that fail without a server.
