#!/usr/bin/env python3
"""
fetch_gaia_stars.py
===================
StarScope — Gaia DR3 Data Pipeline
-----------------------------------
Queries the official ESA Gaia DR3 archive via astroquery.gaia (TAP+ protocol),
extracts the 15 nearest valid stars (parallax > 200 mas), converts all units,
and exports:

  gaia-stars-v2.json   — static star catalog for explore.html
  gaia-stars-v2.csv    — same data as a flat CSV for inspection

UNIT CONVERSIONS (all documented below):
  Distance (parsecs)    : d_pc  = 1000 / parallax_mas
                          Parallax is defined as the angle (in arcseconds) subtended
                          by 1 AU at the star's distance. 1 parsec = distance at
                          which 1 AU subtends 1 arcsecond. Gaia reports in
                          milliarcseconds (mas), so we divide 1000 (not 1) by
                          the parallax in mas to get parsecs.

  Distance (light-years): d_ly  = d_pc * 3.26156
                          1 parsec = 3.26156 light-years (IAU 2012 exact value).

  Cartesian (x, y, z)  : Spherical-to-Cartesian in equatorial frame.
                          RA and DEC are converted from degrees to radians first.
                            x = d_pc * cos(dec_rad) * cos(ra_rad)
                            y = d_pc * cos(dec_rad) * sin(ra_rad)
                            z = d_pc * sin(dec_rad)
                          Origin = Solar System barycentre.
                          +x points toward RA=0h, DEC=0°  (vernal equinox direction)
                          +y points toward RA=6h, DEC=0°
                          +z points toward DEC=+90° (celestial north pole)

REQUIREMENTS:
  pip install astroquery astropy

USAGE:
  python fetch_gaia_stars.py

  Outputs gaia-stars-v2.json and gaia-stars-v2.csv in the same directory.
"""

import csv
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

OUTPUT_DIR      = Path(__file__).parent          # same folder as this script
JSON_OUT        = OUTPUT_DIR / "gaia-stars-v2.json"
CSV_OUT         = OUTPUT_DIR / "gaia-stars-v2.csv"

PARALLAX_MIN_MAS = 200.0    # only stars closer than ~5 pc (16.3 ly)
TARGET_COUNT     = 15       # how many stars we want in the final catalog
QUERY_LIMIT      = 40       # fetch extra rows to survive any nulls after filtering

# IAU 2012 exact value (used consistently with gaia-adapter.js)
PC_TO_LY        = 3.26156

# ─────────────────────────────────────────────────────────────────────────────
# COMMON NAME MAP
# Maps Gaia DR3 source_id (string) → common name.
# The ~25 stars that could appear in a parallax > 200 mas query are all
# well-studied objects; names are sourced from SIMBAD / IAU catalog.
# ─────────────────────────────────────────────────────────────────────────────

KNOWN_NAMES: dict[str, dict] = {
    # source_id : { name, aliases }
    "5853498713190525696": {
        "name": "Proxima Centauri",
        "id":   "proxima-centauri",
        "aliases": ["Alpha Centauri C", "GJ 551", "HIP 70890"],
    },
    "4472832130942575872": {
        "name": "Barnard's Star",
        "id":   "barnards-star",
        "aliases": ["GJ 699", "HIP 87937"],
    },
    # Wolf 359 — Gaia DR3 source_id confirmed via SIMBAD cross-match
    "3864972938605115776": {
        "name": "Wolf 359",
        "id":   "wolf-359",
        "aliases": ["CN Leonis", "GJ 406", "HIP 54035"],
    },
    # Lalande 21185
    "757076635753284864": {
        "name": "Lalande 21185",
        "id":   "lalande-21185",
        "aliases": ["GJ 411", "HIP 54211"],
    },
    # Sirius A
    "2947050466531873024": {
        "name": "Sirius A",
        "id":   "sirius-a",
        "aliases": ["Alpha Canis Majoris", "GJ 244", "HIP 32349"],
    },
    # Luyten 726-8 A (BL Ceti)
    "2452378776434477184": {
        "name": "Luyten 726-8 A",
        "id":   "luyten-726-8-a",
        "aliases": ["BL Ceti", "GJ 65 A"],
    },
    # Luyten 726-8 B (UV Ceti)
    "2452378776434477056": {
        "name": "Luyten 726-8 B",
        "id":   "luyten-726-8-b",
        "aliases": ["UV Ceti", "GJ 65 B"],
    },
    # Ross 154
    "6864024747528099456": {
        "name": "Ross 154",
        "id":   "ross-154",
        "aliases": ["GJ 729", "HIP 92403"],
    },
    # Ross 248
    "1984023335647898496": {
        "name": "Ross 248",
        "id":   "ross-248",
        "aliases": ["GJ 905", "HIP 117473"],
    },
    # Epsilon Eridani
    "5164707970261890560": {
        "name": "Epsilon Eridani",
        "id":   "epsilon-eridani",
        "aliases": ["Ran", "GJ 144", "HIP 16537"],
    },
    # Lacaille 9352
    "6553614253923452800": {
        "name": "Lacaille 9352",
        "id":   "lacaille-9352",
        "aliases": ["GJ 887", "HIP 114046"],
    },
    # Ross 128
    "3748547471818399232": {
        "name": "Ross 128",
        "id":   "ross-128",
        "aliases": ["GJ 447", "HIP 57548"],
    },
    # EZ Aquarii A/B/C — system; A is brightest
    "6811645908153291520": {
        "name": "EZ Aquarii A",
        "id":   "ez-aquarii-a",
        "aliases": ["GJ 866 A", "Luyten 789-6 A"],
    },
    # 61 Cygni A
    "1872046609345556480": {
        "name": "61 Cygni A",
        "id":   "61-cygni-a",
        "aliases": ["GJ 820 A", "HIP 104214"],
    },
    # 61 Cygni B
    "1872046605050897152": {
        "name": "61 Cygni B",
        "id":   "61-cygni-b",
        "aliases": ["GJ 820 B", "HIP 104217"],
    },
    # Procyon A
    "2826783549695874560": {
        "name": "Procyon A",
        "id":   "procyon-a",
        "aliases": ["Alpha Canis Minoris", "GJ 280", "HIP 37279"],
    },
    # Struve 2398 A (GJ 725 A)
    "2106495504508892288": {
        "name": "Struve 2398 A",
        "id":   "struve-2398-a",
        "aliases": ["GJ 725 A", "HD 173739"],
    },
    # Struve 2398 B (GJ 725 B)
    "2106495500214379648": {
        "name": "Struve 2398 B",
        "id":   "struve-2398-b",
        "aliases": ["GJ 725 B"],
    },
    # Groombridge 34 A (GJ 15 A)
    "385333995591454464": {
        "name": "Groombridge 34 A",
        "id":   "groombridge-34-a",
        "aliases": ["GJ 15 A", "HIP 1803"],
    },
    # Groombridge 34 B (GJ 15 B)
    "385333995591454336": {
        "name": "Groombridge 34 B",
        "id":   "groombridge-34-b",
        "aliases": ["GJ 15 B"],
    },
    # Epsilon Indi
    "6412595290592307840": {
        "name": "Epsilon Indi",
        "id":   "epsilon-indi",
        "aliases": ["GJ 845", "HIP 108870"],
    },
    # DX Cancri
    "704967037597308928": {
        "name": "DX Cancri",
        "id":   "dx-cancri",
        "aliases": ["GJ 1111"],
    },
    # Tau Ceti
    "2452522676807599744": {
        "name": "Tau Ceti",
        "id":   "tau-ceti",
        "aliases": ["GJ 71", "HIP 8102"],
    },
    # Kapteyn's Star
    "4810594479418041856": {
        "name": "Kapteyn's Star",
        "id":   "kapteyns-star",
        "aliases": ["GJ 191", "HIP 24186"],
    },
    # Alpha Centauri A
    "5853498713160606720": {
        "name": "Alpha Centauri A",
        "id":   "alpha-centauri-a",
        "aliases": ["Rigil Kentaurus", "GJ 559 A", "HIP 71683"],
    },
    # Alpha Centauri B
    "5853498713160606592": {
        "name": "Alpha Centauri B",
        "id":   "alpha-centauri-b",
        "aliases": ["Toliman", "GJ 559 B", "HIP 71681"],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# ADQL QUERY
# ─────────────────────────────────────────────────────────────────────────────

ADQL_QUERY = f"""
SELECT TOP {QUERY_LIMIT}
    source_id,
    ra,
    dec,
    parallax,
    teff_gspphot
FROM
    gaiadr3.gaia_source
WHERE
    parallax > {PARALLAX_MIN_MAS}
    AND parallax IS NOT NULL
    AND teff_gspphot IS NOT NULL
ORDER BY
    parallax DESC
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# UNIT CONVERSION HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def parallax_to_pc(parallax_mas: float) -> float:
    """
    Convert parallax in milliarcseconds (mas) to distance in parsecs.

    Formula: d_pc = 1000 / parallax_mas

    Derivation: Parallax is defined as the angle (in arcseconds) subtended
    by 1 AU at the star's location. A parsec is the distance at which 1 AU
    subtends exactly 1 arcsecond. Gaia reports parallax in mas, so:

        d_pc = 1 [arcsec / parallax_arcsec]
             = 1 / (parallax_mas / 1000)
             = 1000 / parallax_mas

    Valid only for positive parallax; raises ValueError otherwise.
    """
    if not math.isfinite(parallax_mas) or parallax_mas <= 0:
        raise ValueError(f"Parallax must be a positive finite number, got: {parallax_mas}")
    return 1000.0 / parallax_mas


def pc_to_ly(parsecs: float) -> float:
    """
    Convert parsecs to light-years.

    Formula: d_ly = d_pc * 3.26156

    The factor 3.26156 is the IAU 2012 exact value of 1 parsec in light-years,
    consistent with gaia-adapter.js.
    """
    return parsecs * PC_TO_LY


def equatorial_to_cartesian(ra_deg: float, dec_deg: float, dist_pc: float) -> tuple[float, float, float]:
    """
    Convert equatorial spherical coordinates to 3-D Cartesian coordinates.

    Inputs:
        ra_deg  — Right Ascension in degrees [0, 360)
        dec_deg — Declination in degrees [-90, +90]
        dist_pc — Distance in parsecs

    Output:
        (x, y, z) in parsecs, in the equatorial Cartesian frame:
            +x  → RA=0h, DEC=0°   (vernal equinox direction)
            +y  → RA=6h, DEC=0°
            +z  → DEC=+90°         (celestial north pole)

    Formulae (standard spherical → Cartesian):
        ra_rad  = ra_deg  * π / 180
        dec_rad = dec_deg * π / 180
        x = dist_pc * cos(dec_rad) * cos(ra_rad)
        y = dist_pc * cos(dec_rad) * sin(ra_rad)
        z = dist_pc * sin(dec_rad)
    """
    ra_rad  = math.radians(ra_deg)
    dec_rad = math.radians(dec_deg)
    cos_dec = math.cos(dec_rad)
    x = dist_pc * cos_dec * math.cos(ra_rad)
    y = dist_pc * cos_dec * math.sin(ra_rad)
    z = dist_pc * math.sin(dec_rad)
    return (x, y, z)


def make_slug(name: str) -> str:
    """Convert a star name to a URL-friendly id slug."""
    return (
        name.lower()
        .replace("'", "")
        .replace(" ", "-")
        .replace("_", "-")
    )


# ─────────────────────────────────────────────────────────────────────────────
# GAIA QUERY
# ─────────────────────────────────────────────────────────────────────────────

def query_gaia() -> list[dict]:
    """
    Run the ADQL query against the Gaia DR3 TAP service and return raw rows.

    Returns a list of dicts with keys: source_id, ra, dec, parallax, teff_gspphot.
    Raises RuntimeError on API or parsing failures.
    """
    try:
        from astroquery.gaia import Gaia
    except ImportError:
        raise RuntimeError(
            "astroquery is not installed.\n"
            "Run: pip install astroquery astropy"
        )

    print("[pipeline] Connecting to Gaia DR3 TAP service...")
    print(f"[pipeline] ADQL query:\n{ADQL_QUERY}\n")

    try:
        Gaia.MAIN_GAIA_TABLE = "gaiadr3.gaia_source"
        Gaia.ROW_LIMIT = QUERY_LIMIT

        job = Gaia.launch_job(
            query=ADQL_QUERY,
            verbose=False,
        )
        results_table = job.get_results()
    except Exception as exc:
        raise RuntimeError(f"Gaia TAP query failed: {exc}") from exc

    if results_table is None or len(results_table) == 0:
        raise RuntimeError("Gaia returned an empty result set for this query.")

    print(f"[pipeline] Received {len(results_table)} rows from Gaia DR3.")

    rows = []
    for row in results_table:
        try:
            source_id   = str(int(row["source_id"]))
            ra          = float(row["ra"])
            dec         = float(row["dec"])
            parallax    = float(row["parallax"])
            temperature = float(row["teff_gspphot"])
        except (KeyError, ValueError, TypeError) as exc:
            print(f"  [skip] Malformed row (source_id={row.get('source_id', '?')}): {exc}")
            continue

        # Guard: skip rows with invalid physics
        if not math.isfinite(parallax) or parallax <= 0:
            print(f"  [skip] source_id={source_id} — invalid parallax ({parallax})")
            continue
        if not math.isfinite(temperature) or temperature <= 0:
            print(f"  [skip] source_id={source_id} — invalid temperature ({temperature})")
            continue
        if not math.isfinite(ra) or not math.isfinite(dec):
            print(f"  [skip] source_id={source_id} — invalid coordinates (RA={ra}, DEC={dec})")
            continue

        rows.append({
            "source_id":   source_id,
            "ra":          ra,
            "dec":         dec,
            "parallax":    parallax,
            "temperature": temperature,
        })

    if len(rows) == 0:
        raise RuntimeError("No valid rows survived the sanity checks. Check the Gaia archive.")

    return rows


# ─────────────────────────────────────────────────────────────────────────────
# BUILD CATALOG ENTRY
# ─────────────────────────────────────────────────────────────────────────────

def build_star_entry(raw: dict, retrieved_utc: str) -> dict:
    """
    Enrich one raw Gaia row into a full catalog entry ready for gaia-adapter.js.

    All unit conversions are documented in the helper functions above.
    """
    source_id   = raw["source_id"]
    ra          = raw["ra"]
    dec         = raw["dec"]
    parallax    = raw["parallax"]
    temperature = raw["temperature"]

    # ── Distance ──────────────────────────────────────────────────────────────
    dist_pc = parallax_to_pc(parallax)   # 1000 / parallax_mas  → parsecs
    dist_ly = pc_to_ly(dist_pc)          # dist_pc * 3.26156    → light-years

    # ── Cartesian position ────────────────────────────────────────────────────
    x, y, z = equatorial_to_cartesian(ra, dec, dist_pc)

    # ── Common name lookup ────────────────────────────────────────────────────
    meta    = KNOWN_NAMES.get(source_id, {})
    name    = meta.get("name",    f"Gaia DR3 {source_id}")
    star_id = meta.get("id",      make_slug(f"gaia-{source_id}"))
    aliases = meta.get("aliases", [])

    return {
        # ── Catalog identity ──────────────────────────────────────────────────
        "id":            star_id,
        "name":          name,
        "source_id":     source_id,
        "aliases":       aliases,

        # ── Raw Gaia values (no modification) ────────────────────────────────
        "ra":            round(ra,          6),
        "dec":           round(dec,         6),
        "parallax":      round(parallax,    6),    # mas
        "temperature":   round(temperature, 4),    # K  (teff_gspphot)

        # ── Derived distances ─────────────────────────────────────────────────
        # d_pc = 1000 / parallax_mas   (parallax definition)
        # d_ly = d_pc * 3.26156        (IAU 2012 exact)
        "dist_pc":       round(dist_pc, 6),
        "dist_ly":       round(dist_ly, 4),

        # ── 3-D Cartesian position (equatorial frame, origin = Sun) ───────────
        # x = d_pc * cos(dec) * cos(ra)
        # y = d_pc * cos(dec) * sin(ra)
        # z = d_pc * sin(dec)
        "x":             round(x, 6),
        "y":             round(y, 6),
        "z":             round(z, 6),

        # ── Provenance ────────────────────────────────────────────────────────
        "retrieved_utc": retrieved_utc,
        "source":        "Gaia DR3 gaiadr3.gaia_source",
    }


# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT WRITERS
# ─────────────────────────────────────────────────────────────────────────────

def write_json(stars: list[dict], path: Path) -> None:
    """Write the star catalog as a pretty-printed JSON array."""
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(stars, fh, indent=2, ensure_ascii=False)
    print(f"[pipeline] Wrote {len(stars)} stars -> {path}")


def write_csv(stars: list[dict], path: Path) -> None:
    """Write the star catalog as a flat CSV (aliases joined with '|')."""
    if not stars:
        return

    # Flatten the aliases list to a pipe-delimited string for CSV
    flat_stars = []
    for s in stars:
        row = dict(s)
        row["aliases"] = "|".join(s.get("aliases", []))
        flat_stars.append(row)

    fieldnames = list(flat_stars[0].keys())

    with open(path, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(flat_stars)

    print(f"[pipeline] Wrote {len(stars)} stars -> {path}")


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def validate_catalog(stars: list[dict]) -> None:
    """
    Sanity-check the final catalog.
    Raises ValueError with a descriptive message on any failure.
    """
    if len(stars) != TARGET_COUNT:
        raise ValueError(
            f"Expected exactly {TARGET_COUNT} stars, got {len(stars)}. "
            "Increase QUERY_LIMIT or check the Gaia archive."
        )

    for i, s in enumerate(stars):
        sid = s.get("source_id", f"index_{i}")

        if s["parallax"] <= PARALLAX_MIN_MAS:
            raise ValueError(
                f"Star {sid} has parallax={s['parallax']} mas, "
                f"which is ≤ {PARALLAX_MIN_MAS} mas filter threshold."
            )

        if s["temperature"] <= 0:
            raise ValueError(f"Star {sid} has non-positive temperature={s['temperature']} K.")

        if s["dist_pc"] <= 0:
            raise ValueError(f"Star {sid} has non-positive dist_pc={s['dist_pc']} pc.")

        # Verify unit conversion consistency
        expected_pc = 1000.0 / s["parallax"]
        if abs(s["dist_pc"] - expected_pc) > 1e-3:
            raise ValueError(
                f"Star {sid}: dist_pc={s['dist_pc']:.6f} does not match "
                f"1000/parallax={expected_pc:.6f}."
            )

    print(f"[pipeline] Validation passed: {len(stars)} stars, "
          f"all parallax > {PARALLAX_MIN_MAS} mas, all temperatures > 0 K.")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("  StarScope — Gaia DR3 Data Pipeline")
    print("=" * 60)

    # 1. Query Gaia archive
    try:
        raw_rows = query_gaia()
    except RuntimeError as exc:
        print(f"\n[ERROR] {exc}")
        sys.exit(1)

    # 2. Keep only the TARGET_COUNT nearest (already sorted by Gaia DESC parallax)
    raw_rows = raw_rows[:TARGET_COUNT]
    print(f"[pipeline] Keeping top {len(raw_rows)} rows (closest stars).")

    # 3. Build enriched catalog entries
    retrieved_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stars = []
    for raw in raw_rows:
        try:
            entry = build_star_entry(raw, retrieved_utc)
            stars.append(entry)
        except Exception as exc:
            print(f"  [skip] source_id={raw.get('source_id', '?')} — enrichment failed: {exc}")

    if not stars:
        print("[ERROR] No stars could be built. Aborting.")
        sys.exit(1)

    # 4. Validate
    try:
        validate_catalog(stars)
    except ValueError as exc:
        print(f"\n[ERROR] Validation failed: {exc}")
        sys.exit(1)

    # 5. Write outputs
    write_json(stars, JSON_OUT)
    write_csv(stars,  CSV_OUT)

    # 6. Print summary table
    print("\n" + "=" * 60)
    print(f"  Catalog Summary  ({len(stars)} stars, Gaia DR3)")
    print("=" * 60)
    header = f"{'#':>2}  {'Name':<22}  {'Parallax (mas)':>14}  {'Dist (ly)':>10}  {'T_eff (K)':>10}"
    print(header)
    print("-" * len(header))
    for i, s in enumerate(stars, 1):
        print(
            f"{i:>2}  {s['name']:<22}  {s['parallax']:>14.3f}  "
            f"{s['dist_ly']:>10.3f}  {s['temperature']:>10.1f}"
        )

    print("=" * 60)
    print(f"\nDone! Files written to:\n  {JSON_OUT}\n  {CSV_OUT}")


if __name__ == "__main__":
    main()

