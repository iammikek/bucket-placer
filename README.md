# Bucket Placer

Daihatsu Copen **JB-DET** cam-bucket catalog and clearance-based placement.

Worn shimless lifters no longer match their side stamps. This project records measured centre thickness, then assigns the best 16 buckets from a pool of up to 32 against cold intake/exhaust clearance targets.

## Cold valve clearance (JB-DET)

| Side | Target | Allowed range |
|------|--------|---------------|
| Intake | **0.20 mm** | 0.17–0.25 mm |
| Exhaust | **0.30 mm** | 0.27–0.35 mm |

## Daihatsu selection formula

```text
new thickness = installed thickness + (measured clearance − specified clearance)
```

- Gap **too small** → thinner bucket  
- Gap **too large** → thicker bucket  

## Workflow

1. Catalog buckets (stamp, rim reading, pin reading) in `cam-buckets.ts`
2. Print the measuring sleeve from `bucket-measure-sleeve.scad` (pin length **18.83 mm**)
3. Centre thickness = pin reading − 18.83
4. Install any 16, fit cams, measure cold gaps — note `set:letter` per port (`1:A`, `2:C`, …)
5. Run `selectBestSixteen()` to place the best 16 from the full pool; leftovers are spares

## Stamp sizing (this catalog)

Two-digit stamp = hundredths of a mm over a **3.20 mm** baseline:

- Code `00` → 3.20 mm  
- Code `18` → 3.38 mm  
- `nominal = 3.20 + stamp / 100`

## Project layout

| File | Role |
|------|------|
| `cam-buckets.ts` | Inventory, pin math, clearance constants |
| `assign-buckets.ts` | Port map + `selectBestSixteen()` |
| `bucket-measure-sleeve.scad` | 3D-printed M3 pin guide |
| `tests/formula.test.ts` | Formula and assignment tests |

## Develop

```bash
npm install
npm test
```

## CI

GitHub Actions runs `npm ci` and `npm test` on every push and pull request to `master`.
