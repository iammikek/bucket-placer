import {
  allCamBuckets,
  centreThicknessMm,
  factoryThicknessMm,
  wearFromBucket,
} from "./cam-buckets.ts";

type ReportRow = {
  key: string;
  set: number;
  id: string;
  stamped: number | null;
  pinReadingMm: number | null;
  measuredMm: number | null;
  factoryMm: number | null;
  wearMm: number | null;
};

function formatMm(value: number | null): string {
  return value == null ? "-" : value.toFixed(2);
}

const rows: ReportRow[] = allCamBuckets
  .map((bucket) => ({
    key: `${bucket.set}:${bucket.id}`,
    set: bucket.set,
    id: bucket.id,
    stamped: bucket.stamped,
    pinReadingMm: bucket.pinReadingMm,
    measuredMm: centreThicknessMm(bucket),
    factoryMm: factoryThicknessMm(bucket),
    wearMm: wearFromBucket(bucket),
  }))
  .sort((a, b) => {
    const wearDiff = (b.wearMm ?? -Infinity) - (a.wearMm ?? -Infinity);
    if (Math.abs(wearDiff) > 1e-9) return wearDiff;
    if (a.set !== b.set) return a.set - b.set;
    return a.id.localeCompare(b.id);
  });

const wearValues = rows.flatMap((row) => (row.wearMm == null ? [] : [row.wearMm]));
const avgWearMm = wearValues.length
  ? wearValues.reduce((sum, wear) => sum + wear, 0) / wearValues.length
  : null;
const maxWearMm = wearValues.length ? Math.max(...wearValues) : null;
const minWearMm = wearValues.length ? Math.min(...wearValues) : null;

console.log("Cam Bucket Report");
console.log("=================");
console.log(`Buckets: ${rows.length}`);
console.log(`Measured: ${rows.filter((row) => row.measuredMm != null).length}`);
console.log(`Average delta from nominal: ${formatMm(avgWearMm)} mm`);
console.log(`Closest to nominal: ${formatMm(maxWearMm)} mm`);
console.log(`Most below nominal: ${formatMm(minWearMm)} mm`);
console.log("");

console.table(
  rows.map((row) => ({
    key: row.key,
    stamped: row.stamped ?? "-",
    pinReadingMm: formatMm(row.pinReadingMm),
    measuredMm: formatMm(row.measuredMm),
    factoryMm: formatMm(row.factoryMm),
    wearMm: formatMm(row.wearMm),
  })),
);
