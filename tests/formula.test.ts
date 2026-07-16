import { describe, expect, it } from "vitest";
import {
  factoryThicknessMm,
  MEASURE_PIN_LENGTH_MM,
  VALVE_CLEARANCE_COLD_MM,
  centreThicknessMm,
  nominalFromStamp,
  thicknessFromReading,
  wearFromBucket,
  type CamBucket,
} from "../cam-buckets";
import {
  bucketKey,
  requiredThicknessMm,
  selectBestSixteen,
  targetClearanceMm,
  type CatalogBucket,
  type PortGapReading,
} from "../assign-buckets";

describe("stamp and pin sizing", () => {
  it("maps stamp codes using 0.020 mm table steps", () => {
    expect(nominalFromStamp(1)).toBeCloseTo(2.5, 5);
    expect(nominalFromStamp(2)).toBeCloseTo(2.52, 5);
    expect(nominalFromStamp(18)).toBeCloseTo(2.84, 5);
    expect(nominalFromStamp(24)).toBeCloseTo(2.96, 5);
  });

  it("derives centre thickness from pin reading", () => {
    expect(thicknessFromReading(12.98)).toBeCloseTo(2.98, 5);
    expect(MEASURE_PIN_LENGTH_MM).toBe(10);

    const bucket: CamBucket = {
      id: "B",
      stamped: 24,
      pinReadingMm: 12.98,
    };
    expect(centreThicknessMm(bucket)).toBeCloseTo(2.98, 5);
    expect(
      centreThicknessMm({ ...bucket, pinReadingMm: null }),
    ).toBeNull();
  });

  it("derives factory thickness and wear from a bucket", () => {
    const bucket: CamBucket = {
      id: "E",
      stamped: 18,
      pinReadingMm: 12.83, // centre 2.83 vs stamp 2.84
    };

    expect(factoryThicknessMm(bucket)).toBeCloseTo(2.84, 5);
    expect(wearFromBucket(bucket)).toBeCloseTo(-0.01, 5);

    expect(
      factoryThicknessMm({ ...bucket }),
    ).toBeCloseTo(2.84, 5);
    expect(
      wearFromBucket({ ...bucket }),
    ).toBeCloseTo(-0.01, 5);
    expect(
      wearFromBucket({ ...bucket, stamped: null }),
    ).toBeNull();
  });
});

describe("Daihatsu clearance formula", () => {
  it("uses different cold targets for intake and exhaust", () => {
    expect(targetClearanceMm("intake")).toBe(0.2);
    expect(targetClearanceMm("exhaust")).toBe(0.3);
    expect(VALVE_CLEARANCE_COLD_MM.intake).toEqual({
      target: 0.2,
      min: 0.17,
      max: 0.25,
    });
    expect(VALVE_CLEARANCE_COLD_MM.exhaust).toEqual({
      target: 0.3,
      min: 0.27,
      max: 0.35,
    });
  });

  it("new = old + (measured − specified)", () => {
    // Gap too small (0.26 vs EX 0.30) → thinner bucket by 0.04
    expect(requiredThicknessMm(3.0, 0.26, "exhaust")).toBeCloseTo(2.96, 5);

    // Gap too large (0.28 vs IN 0.20) → thicker bucket by 0.08
    expect(requiredThicknessMm(3.0, 0.28, "intake")).toBeCloseTo(3.08, 5);

    // Already on target → same thickness
    expect(requiredThicknessMm(3.05, 0.2, "intake")).toBeCloseTo(3.05, 5);
    expect(requiredThicknessMm(3.05, 0.3, "exhaust")).toBeCloseTo(3.05, 5);
  });

  it("matches the Copenworld size-step example direction", () => {
    // EX 0.26 with current lifter → need 0.04 thinner to reach 0.30
    const installed = 2.9;
    const required = requiredThicknessMm(installed, 0.26, "exhaust");
    expect(required).toBeLessThan(installed);
    expect(installed - required).toBeCloseTo(0.04, 5);
  });
});

describe("selectBestSixteen", () => {
  function bucket(
    set: number,
    id: string,
    centreMm: number,
  ): CatalogBucket {
    return {
      set,
      id,
      stamped: null,
      pinReadingMm: centreMm + MEASURE_PIN_LENGTH_MM,
    };
  }

  it("picks the closest of 32 for each port using IN/EX targets", () => {
    const pool: CatalogBucket[] = [
      bucket(1, "A", 3.0),
      bucket(1, "B", 3.02),
      bucket(1, "C", 3.04),
      bucket(1, "D", 3.06),
      bucket(2, "A", 2.96),
      bucket(2, "B", 2.98),
      bucket(2, "C", 3.08),
      bucket(2, "D", 3.1),
    ];

    // Trial: 1:A (3.00) in both ports
    const readings: PortGapReading[] = [
      {
        cylinder: 1,
        side: "intake",
        valve: 1,
        installedBucketKey: "1:A",
        // clearance 0.28 with 3.00 → required 3.08
        measuredClearanceMm: 0.28,
      },
      {
        cylinder: 1,
        side: "exhaust",
        valve: 1,
        installedBucketKey: "1:A",
        // clearance 0.26 with 3.00 → required 2.96
        measuredClearanceMm: 0.26,
      },
    ];

    const plan = selectBestSixteen(readings, pool);

    expect(plan.summary.ports).toBe(2);
    expect(plan.summary.poolSize).toBe(8);
    expect(plan.spares).toHaveLength(6);

    const intake = plan.assignments.find((a) => a.label === "1-IN-1");
    const exhaust = plan.assignments.find((a) => a.label === "1-EX-1");

    expect(intake?.requiredThicknessMm).toBeCloseTo(3.08, 5);
    expect(intake?.bucketKey).toBe("2:C"); // 3.08 exact
    expect(intake?.predictedClearanceMm).toBeCloseTo(0.2, 5);
    expect(intake?.inSpec).toBe(true);

    expect(exhaust?.requiredThicknessMm).toBeCloseTo(2.96, 5);
    expect(exhaust?.bucketKey).toBe("2:A"); // 2.96 exact
    expect(exhaust?.predictedClearanceMm).toBeCloseTo(0.3, 5);
    expect(exhaust?.inSpec).toBe(true);

    expect(new Set(plan.assignments.map((a) => a.bucketKey)).size).toBe(2);
  });

  it("builds stable bucket keys across sets", () => {
    expect(bucketKey(1, "A")).toBe("1:A");
    expect(bucketKey(2, "P")).toBe("2:P");
  });
});
