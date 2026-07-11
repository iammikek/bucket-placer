// Cam bucket measuring sleeve — M3 hex bolt guide
// Daihatsu Copen cam buckets (shimless lifters)
//
// As deep as the bolt allows, while leaving the hex head clear so the
// micrometer spindle/anvil can reach it. Tip still protrudes onto the pad.
//
// Bolt bore is tight: friction-fit the shank, or print a tap drill and
// run an M3 tap through for a screw-in fit.
//
// Longer bolt → deeper guide. Prefer M3x16 or M3x20 for more support.
//
// Usage:
//   1. Micrometer the bolt tip → top of hex head; write that length down.
//   2. Print (PETG/ABS preferred; PLA ok for light use).
//   3. If fit="tap", run an M3 tap through the bore.
//   4. Push sleeve into the bucket; friction-push or screw the bolt tip-down.
//   5. Micrometer: anvil on cam face, spindle on bolt head.
//        bucket_thickness = reading - 18.83
//   Measured pin length (tip → top of hex): 18.83 mm

/* [Bucket] */
bucket_od = 23.5;          // measured
bucket_id = 20.5;          // OD - 2×1.5 mm wall
bucket_clearance = -0.3;   // was 0.2; +0.5 mm OD for tighter fit (slight interference)
cup_depth = 24.0;          // measured rim → pad

/* [Bolt] */
bolt_nominal = 16;         // [6, 8, 10, 12, 16, 18, 20] — longer = deeper sleeve
bolt_shank_d = 3.0;
bolt_head_af = 5.5;
bolt_head_height = 3.1;    // approx; actual tip→top measured below
bolt_measured_length = 18.83; // tip → top of hex (use this when subtracting)
// Extra room around the hex so the micrometer anvil can reach the head
head_pocket_clearance = 2.5;
// How deep the wide head pocket is cut into the top (mm)
head_pocket_depth = 4.0;

/* [Bolt fit] */
// "friction" = press/twist the plain shank in
// "tap"      = 2.5 mm hole, then cut M3 thread with a tap (most repeatable)
fit = "friction";          // [friction, tap]
// Friction bore (mm). Start at 2.90; go 2.85 if loose, 2.95 if too tight
friction_bore = 2.90;
// Standard M3 tap drill
tap_drill = 2.50;

/* [Sleeve] */
tip_protrusion = 2.5;      // tip past sleeve → onto pad
head_protrusion = 3.0;     // hex clear above sleeve for micrometer
bolt_overall = bolt_measured_length;
insert_depth = min(
  cup_depth - tip_protrusion,
  bolt_overall - tip_protrusion - head_protrusion
);
lip_height = 1.5;

/* [Print] */
$fn = 96;

function bolt_bore() =
  fit == "tap" ? tap_drill : friction_bore;

module measuring_sleeve() {
  tube_od = bucket_id - bucket_clearance;
  tube_id = bolt_bore();
  // Wide well around the hex for micrometer access
  head_pocket_d = min(
    tube_od - 1.2,
    bolt_head_af / cos(30) + head_pocket_clearance * 2
  );
  lead_in = 0.4;

  assert(tube_od > tube_id + 1.2,
    "bucket_id too small for M3 bore");
  // tube_od may exceed bucket_id slightly for a press fit
  assert(insert_depth > 4,
    "bolt too short — use a longer M3 or reduce head_protrusion");
  assert(head_protrusion >= 2.0,
    "leave at least ~2–3 mm of head clear for the micrometer");
  assert(tube_id < bolt_shank_d,
    "bore should be under M3 shank for friction/tap fit");

  echo(str(
    "fit=", fit,
    " | bore=", tube_id,
    " mm | insert_depth=", insert_depth,
    " mm | bolt~", bolt_overall, " mm"
  ));

  difference() {
    union() {
      translate([0, 0, -insert_depth])
        cylinder(d = tube_od, h = insert_depth + lip_height);

      translate([0, 0, lip_height - 0.01])
        cylinder(d1 = tube_od, d2 = tube_od - 0.6, h = 0.8);
    }

    // Tight main bore
    translate([0, 0, -insert_depth - 1])
      cylinder(d = tube_id, h = insert_depth + lip_height + 3);

    // Wide head well at the top for micrometer anvil access
    translate([0, 0, lip_height - head_pocket_depth])
      cylinder(d = head_pocket_d, h = head_pocket_depth + 2);

    // Short lead-ins so the bolt can start without opening the whole bore
    translate([0, 0, lip_height - 0.01])
      cylinder(d1 = tube_id, d2 = tube_id + lead_in * 2, h = 0.8);

    translate([0, 0, -insert_depth - 0.01])
      cylinder(d1 = tube_id + lead_in * 2, d2 = tube_id, h = 0.8);
  }
}

measuring_sleeve();
