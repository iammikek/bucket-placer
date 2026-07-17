# AGENTS.md — Bucket Placer

Guidance for AI agents working in this repo with Mike on the Daihatsu Copen JB-DET cam-bucket rebuild.

## What this project is

A **single pool of 32** used cam buckets (IDs `A`–`Z`, then `AA`–`AF`), pin-measured, plus a matcher that picks the best 16 for the head after one cold gap pass.

Public-facing explanation: `README.md`. Matching logic: `assign-buckets.ts` (`selectBestSixteen`). Inventory: `cam-buckets.ts`. Web UI: `src/` (Vite).

## How Mike usually works

He measures at the bench and pastes readings in chat. **Update `cam-buckets.ts` and keep the UI in sync by refreshing** — he does not need to edit TypeScript himself for routine cataloguing.

Typical paste formats:

| Paste | Meaning |
|-------|---------|
| `A 19` | ID + stamp only |
| `A 19 2.85` | ID + stamp + **centre thickness** (mm) |
| `A 2.85` | Update centre only (stamp unchanged) |
| `G 20` | Correct stamp only |

Centre thickness is what he reports after the pin tool. Store it as:

```text
pinReadingMm = centreMm + MEASURE_PIN_LENGTH_MM   // 10.00
```

Confirm back: ID, stamp, centre, nominal (`2.48 + stamp × 0.02`), wear (`measured − factory`). Wear **negative** = thinner than stamp.

Do **not** invent readings. Do **not** remeasure or clear the catalog unless he asks.

## Measuring conventions (do not “fix”)

- Pin length: **10.00 mm** (`MEASURE_PIN_LENGTH_MM`)
- Pin diameter ≈ valve stem (**~4.5 mm**) — already used for the current catalog; no remeasure needed for that redesign
- Placement uses **centre thickness**, never the side stamp alone
- British English in user-facing copy

## Web UI (`npm run dev`)

Three steps:

1. **Pool** — reads `camBuckets` from `cam-buckets.ts`
2. **Gap pass** — trial bucket + cold clearance per port (16). Dropdown shows `letter · stamp N`. Drafts live in browser `localStorage`
3. **Plan** — runs `selectBestSixteen()`, shows chosen bucket, predicted clearance, spares

Agents normally **do not** enter gap data for him unless he pastes a full gap sheet. When he does, either update a small script/test fixture or help him fill the UI fields.

Port labels: `1-IN-1` … `4-EX-2`. Bucket keys: letter id only (`A`, `Q`, `AA`) — not `1:A`.

## Matcher (when helping with placement)

Formula:

```text
required = installedCentre + (measuredGap − target)
```

Targets: IN **0.20** (0.17–0.25), EX **0.30** (0.27–0.35).

Greedy best-fit on `|thickness − required|`. Remaining buckets are spares. After valve lapping, clearance **tightens** → often need **thinner** buckets.

## Commands

```bash
npm run dev              # UI http://localhost:5173
npm run report:buckets   # catalog table
npm test
npm run build
```

## Files to touch (usual)

| Task | Files |
|------|--------|
| New / updated measurements | `cam-buckets.ts` (and catalog canvas if one is open) |
| Matcher behaviour | `assign-buckets.ts` + `tests/formula.test.ts` |
| UI | `src/App.tsx`, `src/styles.css` |
| Human docs | `README.md` |
| Agent docs | `AGENTS.md` (this file) |

## Don’t

- Split the pool back into two sets unless asked
- Treat stamp as truth over pin centre
- Push to git unless asked
- Commit secrets or `.env` files (none expected here)
