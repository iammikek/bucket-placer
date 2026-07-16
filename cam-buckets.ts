/**
 * Daihatsu Copen cam bucket inventory (loose stock).
 *
 * 32 buckets, continuous IDs A–Z then AA–AF:
 *   A–P  = leftovers from both original engines
 *   Q–AF = fitted for the original head rebuild
 *
 * Thermal history is mixed and not tagged per bucket yet:
 *   - some (esp. in Q–AF) may have seen both overheat events
 *   - some in either set may have seen one
 *   - some may have seen none
 * Stamped numbers may not match actual thickness after heat / wear.
 * Exhaust-side buckets are expected to wear faster — working hypothesis
 * until clearances are checked on install.
 *
 * Sizing: factory table shows 0.020 mm steps:
 *   Code 01 → 2.500 mm
 *   Code 02 → 2.520 mm
 *   Code 18 → 2.840 mm
 *   nominalMm = 2.48 + stamped * 0.02
 *
 * Measuring pin (rebuilt sleeve): thickness = pinReadingMm − 10.00
 */

export type CamBucket = {
  /** Letter tag on the bucket while cataloguing (unique within its set) */
  id: string;
  /** Number stamped on the side (null if unreadable) */
  stamped: number | null;
  /** Micrometer reading with measuring pin (mm); null until measured */
  pinReadingMm: number | null;
  /** Optional condition / history note (e.g. corrosion, overheat exposure) */
  note?: string;
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
  return 2.48 + stamped * 0.02;
}

/** Factory nominal thickness for a bucket, or null if the stamp is unknown. */
export function factoryThicknessMm(
  bucket: Pick<CamBucket, "stamped">,
): number | null {
  if (bucket.stamped == null) return null;
  return nominalFromStamp(bucket.stamped);
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
 * Measuring pin (rebuilt sleeve / known length).
 * Thickness = micrometer reading − pin length.
 */
export const MEASURE_PIN_LENGTH_MM = 10;

/** Centre thickness from a pin-assisted micrometer reading. */
export function thicknessFromReading(readingMm: number): number {
  return readingMm - MEASURE_PIN_LENGTH_MM;
}

/** Centre thickness for a bucket, or null if not yet pin-measured. */
export function centreThicknessMm(
  bucket: Pick<CamBucket, "pinReadingMm">,
): number | null {
  if (bucket.pinReadingMm == null) return null;
  return thicknessFromReading(bucket.pinReadingMm);
}

/**
 * Thickness vs factory stamp (mm), or null if unknown.
 * Negative = thinner than stamp (worn); positive = thicker than stamp.
 */
export function wearFromBucket(
  bucket: Pick<CamBucket, "stamped" | "pinReadingMm">,
): number | null {
  const measured = centreThicknessMm(bucket);
  if (measured == null) return null;
  const factory = factoryThicknessMm(bucket);
  if (factory == null) return null;
  return +(measured - factory).toFixed(2);
}

/** Full catalogue with 10 mm pin centre readings (A–AF). */
export const camBucketSets: CamBucketSet[] = [
  {
    set: 1,
    note: "Leftovers from both original engines (10 mm pin measured)",
    buckets: [
      { id: "A", stamped: 19, pinReadingMm: 12.85 },
      { id: "B", stamped: 23, pinReadingMm: 12.94 },
      { id: "C", stamped: 23, pinReadingMm: 12.92 },
      { id: "D", stamped: 23, pinReadingMm: 12.93 },
      { id: "E", stamped: 18, pinReadingMm: 12.84 },
      { id: "F", stamped: 22, pinReadingMm: 12.92 },
      { id: "G", stamped: 20, pinReadingMm: 12.89 },
      { id: "H", stamped: 21, pinReadingMm: 12.91 },
      { id: "I", stamped: 23, pinReadingMm: 12.95 },
      { id: "J", stamped: 18, pinReadingMm: 12.86, note: "corroded" },
      { id: "K", stamped: 18, pinReadingMm: 12.85 },
      { id: "L", stamped: 22, pinReadingMm: 12.93 },
      { id: "M", stamped: 24, pinReadingMm: 12.97 },
      { id: "N", stamped: 20, pinReadingMm: 12.88 },
      { id: "O", stamped: 25, pinReadingMm: 12.98 },
      { id: "P", stamped: 20, pinReadingMm: 12.89 },
    ],
  },
  {
    set: 2,
    note: "From original head rebuild (10 mm pin measured)",
    buckets: [
      { id: "Q", stamped: 15, pinReadingMm: 12.79 },
      { id: "R", stamped: 16, pinReadingMm: 12.81 },
      { id: "S", stamped: 15, pinReadingMm: 12.79 },
      { id: "T", stamped: 17, pinReadingMm: 12.83 },
      { id: "U", stamped: 18, pinReadingMm: 12.84 },
      { id: "V", stamped: 13, pinReadingMm: 12.75 },
      { id: "W", stamped: 18, pinReadingMm: 12.85 },
      { id: "X", stamped: 17, pinReadingMm: 12.83 },
      { id: "Y", stamped: 14, pinReadingMm: 12.76 },
      { id: "Z", stamped: 17, pinReadingMm: 12.81 },
      { id: "AA", stamped: 14, pinReadingMm: 12.77 },
      { id: "AB", stamped: 15, pinReadingMm: 12.79 },
      { id: "AC", stamped: 16, pinReadingMm: 12.81 },
      { id: "AD", stamped: 18, pinReadingMm: 12.84 },
      { id: "AE", stamped: 18, pinReadingMm: 12.85 },
      { id: "AF", stamped: 13, pinReadingMm: 12.75 },
    ],
  },
];

/** Flat list across all sets (set number attached). */
export const allCamBuckets = camBucketSets.flatMap((s) =>
  s.buckets.map((b) => ({ ...b, set: s.set })),
);
