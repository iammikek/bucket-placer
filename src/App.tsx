import { useState } from "react";
import {
  MEASURE_PIN_DIAMETER_MM,
  MEASURE_PIN_LENGTH_MM,
  camBuckets,
  centreThicknessMm,
  factoryThicknessMm,
  wearFromBucket,
} from "../cam-buckets";
import {
  VALVE_PORTS,
  bucketKey,
  catalogPool,
  portLabel,
  selectBestSixteen,
  targetClearanceMm,
  type AssignmentPlan,
  type PortGapReading,
  type ValvePort,
  type ValveSide,
} from "../assign-buckets";

type Step = "pool" | "gaps" | "plan";

type GapDraft = {
  installedBucketKey: string;
  measuredClearanceMm: string;
};

const STORAGE_KEY = "bucket-placer-gap-drafts-v2";

function portStorageKey(port: ValvePort): string {
  return portLabel(port);
}

function emptyDrafts(): Record<string, GapDraft> {
  const out: Record<string, GapDraft> = {};
  for (const port of VALVE_PORTS) {
    out[portStorageKey(port)] = {
      installedBucketKey: "",
      measuredClearanceMm: "",
    };
  }
  return out;
}

function loadDrafts(): Record<string, GapDraft> {
  const base = emptyDrafts();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, GapDraft>;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

function formatMm(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

function sideShort(side: ValveSide): string {
  return side === "intake" ? "IN" : "EX";
}

export function App() {
  const [step, setStep] = useState<Step>("pool");
  const [drafts, setDrafts] = useState<Record<string, GapDraft>>(loadDrafts);
  const [plan, setPlan] = useState<AssignmentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pool = catalogPool();
  const bucketOptions = pool.map((b) => ({
    key: bucketKey(b.id),
    label: `${b.id}${b.stamped == null ? "" : ` · stamp ${b.stamped}`}`,
  }));

  function updateDraft(port: ValvePort, patch: Partial<GapDraft>) {
    const key = portStorageKey(port);
    setDrafts((prev) => {
      const next = {
        ...prev,
        [key]: { ...prev[key], ...patch },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setPlan(null);
    setError(null);
  }

  function runMatcher() {
    setError(null);
    const readings: PortGapReading[] = [];

    for (const port of VALVE_PORTS) {
      const draft = drafts[portStorageKey(port)];
      if (!draft?.installedBucketKey || draft.measuredClearanceMm === "") {
        setError(
          `Fill trial bucket and clearance for every port (missing ${portLabel(port)}).`,
        );
        setStep("gaps");
        return;
      }
      const gap = Number(draft.measuredClearanceMm);
      if (!Number.isFinite(gap)) {
        setError(`Bad clearance on ${portLabel(port)}.`);
        setStep("gaps");
        return;
      }
      readings.push({
        ...port,
        installedBucketKey: draft.installedBucketKey,
        measuredClearanceMm: gap,
      });
    }

    try {
      const next = selectBestSixteen(readings, pool);
      setPlan(next);
      setStep("plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("gaps");
    }
  }

  function clearGaps() {
    const next = emptyDrafts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDrafts(next);
    setPlan(null);
    setError(null);
  }

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Automica Labs</p>
        <h1>Bucket Placer</h1>
        <p className="lede">
          Catalog measured JB-DET cam buckets, run one cold gap pass, then place
          the best 16 from a single pool of 32. Pool data stays in{" "}
          <code>cam-buckets.ts</code>; gap drafts save in this browser.
        </p>
      </header>

      <nav className="steps" aria-label="Workflow">
        <button
          type="button"
          className={step === "pool" ? "step active" : "step"}
          onClick={() => setStep("pool")}
        >
          1 · Pool
        </button>
        <button
          type="button"
          className={step === "gaps" ? "step active" : "step"}
          onClick={() => setStep("gaps")}
        >
          2 · Gap pass
        </button>
        <button
          type="button"
          className={step === "plan" ? "step active" : "step"}
          onClick={() => setStep("plan")}
          disabled={!plan}
        >
          3 · Plan
        </button>
      </nav>

      {error ? <p className="banner error">{error}</p> : null}

      {step === "pool" ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Measured pool</h2>
            <p>
              {pool.length} pin-measured · pin {MEASURE_PIN_LENGTH_MM.toFixed(2)}{" "}
              mm long × ~{MEASURE_PIN_DIAMETER_MM.toFixed(1)} mm stem width ·
              centre = reading − pin
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Stamp</th>
                  <th>Pin</th>
                  <th>Centre</th>
                  <th>Factory</th>
                  <th>Wear</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {camBuckets.map((b) => {
                  const centre = centreThicknessMm(b);
                  const factory = factoryThicknessMm(b);
                  const wear = wearFromBucket(b);
                  return (
                    <tr key={b.id}>
                      <td>
                        <code>{b.id}</code>
                      </td>
                      <td className="num">
                        {b.stamped == null ? "—" : b.stamped}
                      </td>
                      <td className="num">{formatMm(b.pinReadingMm)}</td>
                      <td className="num">{formatMm(centre)}</td>
                      <td className="num">{formatMm(factory)}</td>
                      <td className="num">
                        {wear == null
                          ? "—"
                          : `${wear > 0 ? "+" : ""}${wear.toFixed(2)}`}
                      </td>
                      <td>{b.note ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="hint">
            Update the pool in chat or edit <code>cam-buckets.ts</code>, then
            refresh. Wear = measured − factory (negative = thinner than stamp).
          </p>
          <button type="button" className="primary" onClick={() => setStep("gaps")}>
            Continue to gap pass
          </button>
        </section>
      ) : null}

      {step === "gaps" ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Cold gap pass</h2>
            <p>
              Install any 16, note which bucket is in each port, measure
              clearance. Targets IN {targetClearanceMm("intake").toFixed(2)} / EX{" "}
              {targetClearanceMm("exhaust").toFixed(2)} mm.
            </p>
          </div>

          <div className="gap-grid">
            {([1, 2, 3, 4] as const).map((cylinder) => (
              <div key={cylinder} className="cyl-block">
                <h3>Cylinder {cylinder}</h3>
                <div className="cyl-ports">
                  {VALVE_PORTS.filter((p) => p.cylinder === cylinder).map(
                    (port) => {
                      const key = portStorageKey(port);
                      const draft = drafts[key];
                      return (
                        <label key={key} className="port-field">
                          <span className="port-label">
                            {sideShort(port.side)}-{port.valve}
                            <span className="muted">
                              {" "}
                              target {targetClearanceMm(port.side).toFixed(2)}
                            </span>
                          </span>
                          <select
                            value={draft.installedBucketKey}
                            onChange={(e) =>
                              updateDraft(port, {
                                installedBucketKey: e.target.value,
                              })
                            }
                          >
                            <option value="">Trial bucket…</option>
                            {bucketOptions.map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max="1"
                            placeholder="Gap mm"
                            value={draft.measuredClearanceMm}
                            onChange={(e) =>
                              updateDraft(port, {
                                measuredClearanceMm: e.target.value,
                              })
                            }
                          />
                        </label>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button type="button" className="ghost" onClick={clearGaps}>
              Clear gaps
            </button>
            <button type="button" className="primary" onClick={runMatcher}>
              Run selectBestSixteen()
            </button>
          </div>
        </section>
      ) : null}

      {step === "plan" && plan ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Placement plan</h2>
            <p>
              {plan.summary.inSpec}/{plan.summary.ports} in spec · mean |error|{" "}
              {formatMm(plan.summary.meanAbsErrorMm, 3)} mm · max |error|{" "}
              {formatMm(plan.summary.maxErrorMm, 3)} mm · pool{" "}
              {plan.summary.poolSize}
            </p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Choose</th>
                  <th>Centre</th>
                  <th>Required</th>
                  <th>Predicted gap</th>
                  <th>|Error|</th>
                  <th>Trial</th>
                  <th>Spec</th>
                </tr>
              </thead>
              <tbody>
                {plan.assignments.map((a) => (
                  <tr key={a.label} className={a.inSpec ? undefined : "warn"}>
                    <td>{a.label}</td>
                    <td>
                      <code>{a.bucketKey}</code>
                    </td>
                    <td className="num">{formatMm(a.bucketThicknessMm, 3)}</td>
                    <td className="num">{formatMm(a.requiredThicknessMm, 3)}</td>
                    <td className="num">{formatMm(a.predictedClearanceMm, 3)}</td>
                    <td className="num">{formatMm(a.errorMm, 3)}</td>
                    <td>
                      <code>{a.trialBucketKey}</code> @{" "}
                      {formatMm(a.trialClearanceMm, 3)}
                    </td>
                    <td>{a.inSpec ? "in" : "out"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="spares-title">Spares ({plan.spares.length})</h3>
          <p className="spares">
            {plan.spares.length === 0
              ? "None"
              : plan.spares.map((b) => b.id).join(" · ")}
          </p>

          <div className="actions">
            <button type="button" className="ghost" onClick={() => setStep("gaps")}>
              Edit gaps
            </button>
            <button type="button" className="primary" onClick={runMatcher}>
              Re-run matcher
            </button>
          </div>
        </section>
      ) : null}

      <footer className="footer">
        JB-DET · measure once · trial gaps once · place the best 16
      </footer>
    </div>
  );
}
