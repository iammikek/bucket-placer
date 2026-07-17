/**
 * Assign cam buckets to JB-DET valve ports from a single pool of up to 32.
 *
 * Workflow:
 *   1. Install any 16 from the pool — note id per port ("A", "Q", …).
 *   2. Fit cams, measure cold clearance at each port.
 *   3. required = installedCentre + (gap − target)
 *      IN target 0.20 · EX target 0.30
 *   4. selectBestSixteen() picks the best 16 out of all pin-measured stock
 *      and places them; the rest stay as spares.
 */

import {
  CamBucket,
  VALVE_CLEARANCE_COLD_MM,
  camBuckets,
  centreThicknessMm,
} from "./cam-buckets";

export type ValveSide = "intake" | "exhaust";

export type ValvePort = {
  cylinder: 1 | 2 | 3 | 4;
  side: ValveSide;
  valve: 1 | 2;
};

/** Bucket in the placement pool (same shape as catalog). */
export type CatalogBucket = CamBucket;

/** Pool key is the letter id (A–AF). */
export function bucketKey(id: string): string {
  return id;
}

export function parseBucketKey(key: string): { id: string } {
  const id = key.includes(":") ? key.split(":")[1] : key;
  if (!id) throw new Error(`Bad bucket key "${key}" (expected "A" or "AA")`);
  return { id };
}

export type PortGapReading = ValvePort & {
  /** e.g. "G" — whatever is in the port for the gap pass */
  installedBucketKey: string;
  measuredClearanceMm: number;
};

export type BucketAssignment = ValvePort & {
  label: string;
  requiredThicknessMm: number;
  targetClearanceMm: number;
  trialBucketKey: string;
  trialThicknessMm: number;
  trialClearanceMm: number;
  bucket: CatalogBucket;
  bucketKey: string;
  bucketThicknessMm: number;
  predictedClearanceMm: number;
  errorMm: number;
  inSpec: boolean;
};

export type AssignmentPlan = {
  assignments: BucketAssignment[];
  /** Not chosen for the head — keep as spares */
  spares: CatalogBucket[];
  summary: {
    ports: number;
    poolSize: number;
    inSpec: number;
    outOfSpec: number;
    maxErrorMm: number;
    meanAbsErrorMm: number;
  };
};

export function portLabel(port: ValvePort): string {
  const side = port.side === "intake" ? "IN" : "EX";
  return `${port.cylinder}-${side}-${port.valve}`;
}

export const VALVE_PORTS: ValvePort[] = ([1, 2, 3, 4] as const).flatMap(
  (cylinder) =>
    (["intake", "exhaust"] as const).flatMap((side) =>
      ([1, 2] as const).map((valve) => ({ cylinder, side, valve })),
    ),
);

export function targetClearanceMm(side: ValveSide): number {
  return VALVE_CLEARANCE_COLD_MM[side].target;
}

export function clearanceRangeMm(side: ValveSide): { min: number; max: number } {
  const s = VALVE_CLEARANCE_COLD_MM[side];
  return { min: s.min, max: s.max };
}

export function requiredThicknessMm(
  installedThicknessMm: number,
  measuredClearanceMm: number,
  side: ValveSide,
): number {
  return installedThicknessMm + (measuredClearanceMm - targetClearanceMm(side));
}

/** Every pin-measured bucket in the pool. */
export function catalogPool(): CatalogBucket[] {
  return camBuckets.filter((b) => centreThicknessMm(b) != null);
}

type SizedBucket = CatalogBucket & { thicknessMm: number; key: string };

function sizeBucket(b: CatalogBucket): SizedBucket | null {
  const t = centreThicknessMm(b);
  if (t == null) return null;
  return { ...b, thicknessMm: t, key: bucketKey(b.id) };
}

function sizedPool(buckets: CatalogBucket[]): SizedBucket[] {
  return buckets.map(sizeBucket).filter((b): b is SizedBucket => b != null);
}

function findSized(pool: SizedBucket[], key: string): SizedBucket {
  const id = parseBucketKey(key).id;
  const b = pool.find((x) => x.key === id || x.id === id);
  if (!b) throw new Error(`Unknown or unmeasured bucket "${key}"`);
  return b;
}

function predictedClearance(
  required: number,
  bucketThickness: number,
  side: ValveSide,
): number {
  return targetClearanceMm(side) + (required - bucketThickness);
}

function inSpec(clearance: number, side: ValveSide): boolean {
  const { min, max } = clearanceRangeMm(side);
  return clearance >= min && clearance <= max;
}

/**
 * Choose the best 16 buckets from the pool and place them on the ports
 * from a cam-gap pass. IN uses 0.20 target, EX 0.30.
 */
export function selectBestSixteen(
  readings: PortGapReading[],
  pool: CatalogBucket[] = catalogPool(),
): AssignmentPlan {
  const sized = sizedPool(pool);

  const pending = readings.map((r) => {
    const trial = findSized(sized, r.installedBucketKey);
    const required = requiredThicknessMm(
      trial.thicknessMm,
      r.measuredClearanceMm,
      r.side,
    );
    return {
      ...r,
      label: portLabel(r),
      trial,
      requiredThicknessMm: required,
      targetClearanceMm: targetClearanceMm(r.side),
    };
  });

  const assignments: BucketAssignment[] = [];
  const usedKeys = new Set<string>();
  const usedPorts = new Set<string>();

  while (assignments.length < pending.length) {
    let best: {
      port: (typeof pending)[number];
      bucket: SizedBucket;
      error: number;
    } | null = null;

    for (const port of pending) {
      if (usedPorts.has(port.label)) continue;
      for (const bucket of sized) {
        if (usedKeys.has(bucket.key)) continue;
        const error = Math.abs(bucket.thicknessMm - port.requiredThicknessMm);
        if (!best || error < best.error - 1e-9) {
          best = { port, bucket, error };
        }
      }
    }

    if (!best) break;

    const predicted = predictedClearance(
      best.port.requiredThicknessMm,
      best.bucket.thicknessMm,
      best.port.side,
    );

    assignments.push({
      cylinder: best.port.cylinder,
      side: best.port.side,
      valve: best.port.valve,
      label: best.port.label,
      requiredThicknessMm: +best.port.requiredThicknessMm.toFixed(3),
      targetClearanceMm: best.port.targetClearanceMm,
      trialBucketKey: best.port.installedBucketKey,
      trialThicknessMm: +best.port.trial.thicknessMm.toFixed(3),
      trialClearanceMm: best.port.measuredClearanceMm,
      bucket: best.bucket,
      bucketKey: best.bucket.key,
      bucketThicknessMm: +best.bucket.thicknessMm.toFixed(3),
      predictedClearanceMm: +predicted.toFixed(3),
      errorMm: +best.error.toFixed(3),
      inSpec: inSpec(predicted, best.port.side),
    });

    usedKeys.add(best.bucket.key);
    usedPorts.add(best.port.label);
  }

  assignments.sort((a, b) => {
    if (a.cylinder !== b.cylinder) return a.cylinder - b.cylinder;
    if (a.side !== b.side) return a.side === "intake" ? -1 : 1;
    return a.valve - b.valve;
  });

  const spares = sized
    .filter((b) => !usedKeys.has(b.key))
    .map(({ thicknessMm: _t, key: _k, ...rest }) => rest);

  const errors = assignments.map((a) => a.errorMm);
  const inSpecCount = assignments.filter((a) => a.inSpec).length;

  return {
    assignments,
    spares,
    summary: {
      ports: assignments.length,
      poolSize: sized.length,
      inSpec: inSpecCount,
      outOfSpec: assignments.length - inSpecCount,
      maxErrorMm: errors.length ? Math.max(...errors) : 0,
      meanAbsErrorMm: errors.length
        ? +(errors.reduce((s, e) => s + e, 0) / errors.length).toFixed(3)
        : 0,
    },
  };
}

/** @deprecated use selectBestSixteen */
export const assignBuckets = selectBestSixteen;
