// Cam bucket measuring sleeve — stem-diameter pin guide
// Daihatsu Copen / JB-DET shimless lifters
//
// Pin length 10.00 mm (subtract from micrometer reading).
// Pin diameter matches the valve stem tip (~4.5 mm on JB-DET) so pad
// contact matches the working footprint, not a sharp M3 point.
//
// Usage:
//   1. Confirm pin length tip → top; keep at 10.00 mm or update below.
//   2. Print sleeve (PETG/ABS preferred).
//   3. Drop pin tip-down onto the pad through the sleeve.
//   4. Micrometer: anvil on cam face, spindle on pin top.
//        bucket_thickness = reading - bolt_measured_length
//
// Legacy M3 hex-bolt parameters below still drive the printed guide;
// update shank diameter if your stem-width pin needs a wider bore.

/* [Bucket] */
bucket_od = 23.5;          // measured
bucket_id = 20.5;          // OD - 2×1.5 mm wall
bucket_clearance = -0.3;   // was 0.2; +0.5 mm OD for tighter fit (slight interference)
cup_depth = 24.0;          // measured rim → pad

/* [Pin] */
// JB-DET stem OD ≈ 4.46–4.48 mm (IN) / 4.455–4.47 mm (EX)
pin_diameter = 4.5;        // match valve stem tip contact
bolt_nominal = 16;         // [6, 8, 10, 12, 16, 18, 20] — longer = deeper sleeve
bolt_shank_d = pin_diameter;
bolt_head_af = 5.5;
bolt_head_height = 3.1;    // approx; actual tip→top measured below
bolt_measured_length = 10.00; // use this when subtracting from micrometer reading
// Extra room around the hex so the micrometer anvil can reach the head
head_pocket_clearance = 2.5;
// How deep the wide head pocket is cut into the top (mm)
head_pocket_depth = 4.0;

/* [Bolt fit] */
// "friction" = press/twist the plain shank in
// "tap"      = legacy M3 tap path (not used with a stem-diameter pin)
fit = "friction";          // [friction, tap]
// Friction bore (mm) — set just under pin_diameter for a snug slide
friction_bore = 4.40;
// Standard M3 tap drill (legacy)
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
    "bucket_id too small for pin bore");
  // tube_od may exceed bucket_id slightly for a press fit
  assert(insert_depth > 4,
    "pin too short — lengthen pin or reduce head_protrusion");
  assert(head_protrusion >= 2.0,
    "leave at least ~2–3 mm of pin/head clear for the micrometer");
  assert(tube_id < bolt_shank_d,
    "bore should be under pin diameter for a snug fit");

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
