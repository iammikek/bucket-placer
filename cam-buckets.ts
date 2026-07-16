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
 * Measuring pin (M3 in printed sleeve): thickness = pinReadingMm − 18.87
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
 * Measuring pin (M3 hex bolt in printed sleeve).
 * Thickness = micrometer reading − pin length.
 */
export const MEASURE_PIN_LENGTH_MM = 18.87;

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

/** Material worn from factory nominal thickness, or null if unknown. */
export function wearFromBucket(
  bucket: Pick<CamBucket, "stamped" | "pinReadingMm">,
): number | null {
  const measured = centreThicknessMm(bucket);
  if (measured == null) return null;
  const factory = factoryThicknessMm(bucket);
  if (factory == null) return null;
  return +(factory - measured).toFixed(2);
}

/** Fresh catalogue — letter + stamp first, then rim / pin readings.
 *  One continuous ID pool: A–Z then AA–AF (32).
 *  A–P = leftovers from both original engines.
 *  Q–AF = buckets fitted for the original head rebuild. */
export const camBucketSets: CamBucketSet[] = [
  {
    set: 1,
    note: "Leftovers from both original engines (stamps; rim / pin pending)",
    buckets: [
      { id: "A", stamped: 19, pinReadingMm: 21.77 },
      { id: "B", stamped: 23, pinReadingMm: 21.82 },
      { id: "C", stamped: 23, pinReadingMm: 21.86 },
      { id: "D", stamped: 23, pinReadingMm: 21.84 },
      { id: "E", stamped: 18, pinReadingMm: 21.72 },
      { id: "F", stamped: 22, pinReadingMm: 21.81 },
      { id: "G", stamped: 20, pinReadingMm: 21.76 },
      { id: "H", stamped: 21, pinReadingMm: 21.78 },
      { id: "I", stamped: 23, pinReadingMm: 21.84 },
      { id: "J", stamped: 18, pinReadingMm: 21.73, note: "corroded" },
      { id: "K", stamped: 18, pinReadingMm: 21.75 },
      { id: "L", stamped: 22, pinReadingMm: 21.82 },
      { id: "M", stamped: 24, pinReadingMm: 21.87 },
      { id: "N", stamped: 20, pinReadingMm: 21.78 },
      { id: "O", stamped: 25, pinReadingMm: 21.89 },
      { id: "P", stamped: 20, pinReadingMm: 21.77 },
    ],
  },
  {
    set: 2,
    note: "From original head rebuild (stamps; rim / pin pending)",
    buckets: [
      { id: "Q", stamped: 15, pinReadingMm: 21.67 },
      { id: "R", stamped: 16, pinReadingMm: 21.69 },
      { id: "S", stamped: 15, pinReadingMm: 21.68 },
      { id: "T", stamped: 17, pinReadingMm: 21.73 },
      { id: "U", stamped: 18, pinReadingMm: 21.70 },
      { id: "V", stamped: 13, pinReadingMm: 21.64 },
      { id: "W", stamped: 18, pinReadingMm: 21.73 },
      { id: "X", stamped: 17, pinReadingMm: 21.72 },
      { id: "Y", stamped: 14, pinReadingMm: 21.63 },
      { id: "Z", stamped: 17, pinReadingMm: 21.68 },
      { id: "AA", stamped: 14, pinReadingMm: 21.64 },
      { id: "AB", stamped: 15, pinReadingMm: 21.66 },
      { id: "AC", stamped: 18, pinReadingMm: 21.74 },
      { id: "AD", stamped: 16, pinReadingMm: 21.71 },
      { id: "AE", stamped: 18, pinReadingMm: 21.73 },
      { id: "AF", stamped: 13, pinReadingMm: 21.64 },
    ],
  },
];

/** Flat list across all sets (set number attached). */
export const allCamBuckets = camBucketSets.flatMap((s) =>
  s.buckets.map((b) => ({ ...b, set: s.set })),
);
