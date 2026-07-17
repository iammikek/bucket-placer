import {
  camBuckets,
  centreThicknessMm,
  factoryThicknessMm,
  wearFromBucket,
} from "./cam-buckets.ts";

type ReportRow = {
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

const rows: ReportRow[] = camBuckets
  .map((bucket) => ({
    id: bucket.id,
    stamped: bucket.stamped,
    pinReadingMm: bucket.pinReadingMm,
    measuredMm: centreThicknessMm(bucket),
    factoryMm: factoryThicknessMm(bucket),
    wearMm: wearFromBucket(bucket),
  }))
  .sort((a, b) => {
    const wearDiff = (a.wearMm ?? Infinity) - (b.wearMm ?? Infinity);
    if (Math.abs(wearDiff) > 1e-9) return wearDiff;
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
    id: row.id,
    stamped: row.stamped ?? "-",
    pinReadingMm: formatMm(row.pinReadingMm),
    measuredMm: formatMm(row.measuredMm),
    factoryMm: formatMm(row.factoryMm),
    wearMm: formatMm(row.wearMm),
  })),
);
