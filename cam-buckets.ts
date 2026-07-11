/**
 * Daihatsu Copen cam bucket inventory (loose stock).
 *
 * Two full sets (16 each) from a pair of engines — one had a head gasket
 * failure (heat / oil dilution can wipe the whole cam face, not just a
 * centre dish). Stamped numbers no longer always match actual thickness.
 * Exhaust-side buckets are expected to wear faster — working hypothesis
 * until clearances are checked on install.
 *
 * Sizing: two-digit stamp = hundredths of a mm over a 3.20 mm baseline.
 *   Code 00 → 3.20 mm
 *   Code 02 → 3.22 mm
 *   Code 18 → 3.38 mm
 *   nominalMm = 3.20 + stamped / 100
 *
 * Measuring pin (M3 in printed sleeve): thickness = pinReadingMm − 18.83
 */

export type CamBucket = {
  /** Letter tag on the bucket while cataloguing (unique within its set) */
  id: string;
  /** Number stamped on the side (null if unreadable) */
  stamped: number | null;
  /** First-pass flat-anvil reading (mm) — often high on dished faces */
  measuredMm: number;
  /** Micrometer reading with measuring pin (mm); null until re-measured */
  pinReadingMm: number | null;
};

export type CamBucketSet = {
  /** 1-based set number */
  set: number;
  /** Optional note (e.g. source engine) */
  note?: string;
  buckets: CamBucket[];
};

/** Nominal thickness from the side stamp (mm). */
export function nominalFromStamp(stamped: number): number {
  return 3.2 + stamped / 100;
}

/**
 * JB-DET cold valve clearance (mm).
 * Target midpoints; use the ranges when checking.
 */
export const VALVE_CLEARANCE_COLD_MM = {
  intake: { target: 0.2, min: 0.17, max: 0.25 },
  exhaust: { target: 0.3, min: 0.27, max: 0.35 },
} as const;

/**
 * Measuring pin (M3 hex bolt in printed sleeve).
 * Thickness = micrometer reading − pin length.
 */
export const MEASURE_PIN_LENGTH_MM = 18.83;

/** Centre thickness from a pin-assisted micrometer reading. */
export function thicknessFromReading(readingMm: number): number {
  return readingMm - MEASURE_PIN_LENGTH_MM;
}

/** Centre thickness for a bucket, or null if not yet pin-measured. */
export function centreThicknessMm(bucket: CamBucket): number | null {
  if (bucket.pinReadingMm == null) return null;
  return thicknessFromReading(bucket.pinReadingMm);
}

export const camBucketSets: CamBucketSet[] = [
  {
    set: 1,
    note: "Source engine unknown (one of the pair had HG failure)",
    buckets: [
      { id: "A", stamped: 23, measuredMm: 3.45, pinReadingMm: 21.87 },
      { id: "B", stamped: 24, measuredMm: 3.02, pinReadingMm: 21.88 },
      { id: "C", stamped: 18, measuredMm: 3.37, pinReadingMm: 21.75 },
      { id: "D", stamped: 20, measuredMm: 3.42, pinReadingMm: 21.77 },
      { id: "E", stamped: 20, measuredMm: 3.48, pinReadingMm: 21.79 },
      { id: "F", stamped: 18, measuredMm: 3.38, pinReadingMm: 21.74 },
      { id: "G", stamped: 23, measuredMm: 3.44, pinReadingMm: 21.85 },
      { id: "H", stamped: 23, measuredMm: 3.46, pinReadingMm: 21.84 },
      { id: "I", stamped: 25, measuredMm: 3.02, pinReadingMm: 21.84 },
      { id: "J", stamped: 22, measuredMm: 3.44, pinReadingMm: 21.83 },
      { id: "K", stamped: 22, measuredMm: 3.47, pinReadingMm: 21.83 },
      { id: "L", stamped: 23, measuredMm: 3.00, pinReadingMm: 21.87 },
      { id: "M", stamped: 21, measuredMm: 3.43, pinReadingMm: 21.83 },
      { id: "N", stamped: 20, measuredMm: 3.44, pinReadingMm: 21.82 },
      { id: "O", stamped: 18, measuredMm: 3.39, pinReadingMm: 21.76 },
      { id: "P", stamped: 19, measuredMm: 3.38, pinReadingMm: 21.77 },
    ],
  },
  {
    set: 2,
    note: "Source engine unknown (one of the pair had HG failure)",
    buckets: [],
  },
];

/** Flat list across all sets (set number attached). */
export const allCamBuckets = camBucketSets.flatMap((s) =>
  s.buckets.map((b) => ({ ...b, set: s.set })),
);
