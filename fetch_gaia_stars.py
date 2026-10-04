#!/usr/bin/env python3
"""
fetch_gaia_stars.py
===================
StarScope — Gaia DR3 Data Pipeline
-----------------------------------
Queries the official ESA Gaia DR3 archive via astroquery.gaia (TAP+ protocol),
extracts the 15 nearest valid stars (parallax > 200 mas), converts all units,
and exports:

  public/data/gaia-stars.json   — static star catalog for explore.html
  public/data/gaia-stars.csv    — same data as a flat CSV for inspection

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

  Outputs public/data/gaia-stars.json and public/data/gaia-stars.csv.
"""

import csv
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

OUTPUT_DIR      = Path(__file__).parent          # same folder as this script
JSON_OUT        = OUTPUT_DIR / "public" / "data" / "gaia-stars.json"
CSV_OUT         = OUTPUT_DIR / "public" / "data" / "gaia-stars.csv"

PARALLAX_MIN_MAS = 200.0    # only nearest-sample stars closer than ~5 pc (16.3 ly)
TARGET_COUNT     = 15       # minimum number of nearest-sample stars
QUERY_LIMIT      = 40       # fetch extra rows to survive any nulls after filtering

# IAU 2012 exact value (used consistently with gaia-adapter.js)
PC_TO_LY        = 3.26156

# ─────────────────────────────────────────────────────────────────────────────
# COMMON NAME MAP
# Maps Gaia DR3 source_id (string) → common name.
# The ~25 stars that could appear in a parallax > 200 mas query are all
# well-studied objects; names are sourced from SIMBAD / IAU catalog.
# ─────────────────────────────────────────────────────────────────────────────

# Verified Gaia DR3 source_ids used for the curated sample (merged with nearest).
CURATED_SOURCE_IDS: list[str] = [
    "5853498713190525696",
    "4472832130942575872",
    "4810594479418041856",
    "1872046609345556480",
    "6553614253923452800",
    "4034171629042489088",
    "2835207319109249920",
    "48026706558487040",
    "66526127137440128",
    "3735000631158990976",
    "2428589330539122304",
    "4017860992519744384",
    "2577061092921353984",
    "1907131544341497600",
]

KNOWN_NAMES: dict[str, dict] = {
    "5853498713190525696": {
        "name": "Proxima Centauri",
        "id": "proxima-centauri",
        "aliases": ["Alpha Centauri C", "GJ 551"],
    },
    "4472832130942575872": {
        "name": "Barnard's Star",
        "id": "barnards-star",
        "aliases": ["GJ 699"],
    },
    "762815470562110464": {
        "name": "Lalande 21185",
        "id": "lalande-21185",
        "aliases": ["GJ 411"],
    },
    "4075141768785646848": {
        "name": "Ross 154",
        "id": "ross-154",
        "aliases": ["GJ 729"],
    },
    "5164707970261890560": {
        "name": "Epsilon Eridani",
        "id": "epsilon-eridani",
        "aliases": ["GJ 144"],
    },
    "6553614253923452800": {
        "name": "Lacaille 9352",
        "id": "lacaille-9352",
        "aliases": ["GJ 887"],
    },
    "3796072592206250624": {
        "name": "Ross 128",
        "id": "ross-128",
        "aliases": ["GJ 447"],
    },
    "1872046574983497216": {
        "name": "61 Cygni B",
        "id": "61-cygni-b",
        "aliases": ["GJ 820 B"],
    },
    "1872046609345556480": {
        "name": "61 Cygni A",
        "id": "61-cygni-a",
        "aliases": ["GJ 820 A"],
    },
    "2154880616774131840": {
        "name": "Struve 2398 A",
        "id": "struve-2398-a",
        "aliases": ["GJ 725 A"],
    },
    "2154880616774131712": {
        "name": "Struve 2398 B",
        "id": "struve-2398-b",
        "aliases": ["GJ 725 B"],
    },
    "385334230892516480": {
        "name": "Groombridge 34 A",
        "id": "groombridge-34-a",
        "aliases": ["GJ 15 A"],
    },
    "385334196532776576": {
        "name": "Groombridge 34 B",
        "id": "groombridge-34-b",
        "aliases": ["GJ 15 B"],
    },
    "6412595290592307840": {
        "name": "Epsilon Indi A",
        "id": "epsilon-indi-a",
        "aliases": ["GJ 845"],
    },
    "3139847906307949696": {
        "name": "Luyten's Star",
        "id": "luytens-star",
        "aliases": ["GJ 273"],
    },
    "4810594479418041856": {
        "name": "Kapteyn's Star",
        "id": "kapteyns-star",
        "aliases": ["GJ 191"],
    },
    "4034171629042489088": {
        "name": "Groombridge 1830",
        "id": "groombridge-1830",
        "aliases": ["GJ 451"],
    },
    "2835207319109249920": {
        "name": "51 Pegasi",
        "id": "51-pegasi",
        "aliases": ["HD 217014"],
    },
    "48026706558487040": {
        "name": "Epsilon Tauri",
        "id": "epsilon-tauri",
        "aliases": ["Ain", "HD 28305"],
    },
    "66526127137440128": {
        "name": "Atlas",
        "id": "atlas",
        "aliases": ["27 Tauri"],
    },
    "3735000631158990976": {
        "name": "Gliese 486",
        "id": "gliese-486",
        "aliases": ["GJ 486"],
    },
    "2428589330539122304": {
        "name": "3 Ceti",
        "id": "3-ceti",
        "aliases": [],
    },
    "4017860992519744384": {
        "name": "Gliese 436",
        "id": "gliese-436",
        "aliases": ["GJ 436"],
    },
    "2577061092921353984": {
        "name": "Zeta Piscium",
        "id": "zeta-piscium",
        "aliases": ["Revati"],
    },
    "1907131544341497600": {
        "name": "1 Lacertae",
        "id": "1-lacertae",
        "aliases": [],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# ADQL QUERY
# ─────────────────────────────────────────────────────────────────────────────

GAIA_COLUMNS = """
    source_id,
    ra,
    dec,
    parallax,
    teff_gspphot,
    phot_g_mean_mag,
    parallax_error,
    bp_rp
""".strip()

ADQL_QUERY = f"""
SELECT TOP {QUERY_LIMIT}
    {GAIA_COLUMNS}
FROM
    gaiadr3.gaia_source
WHERE
    parallax > {PARALLAX_MIN_MAS}
    AND parallax IS NOT NULL
    AND teff_gspphot IS NOT NULL
ORDER BY
    parallax DESC
""".strip()

ADQL_CURATED = f"""
SELECT
    {GAIA_COLUMNS}
FROM
    gaiadr3.gaia_source
WHERE
    source_id IN ({",".join(CURATED_SOURCE_IDS)})
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


def maybe_float(value) -> float | None:
    """Convert a Gaia TAP value to float, or None if masked/empty/non-finite."""
    if value is None or np.ma.is_masked(value):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


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

def query_gaia(adql: str, require_teff: bool = True) -> list[dict]:
    """
    Run an ADQL query against the Gaia DR3 TAP service and return raw rows.

    Returns a list of dicts with Gaia measurements. Masked TAP values become None.
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
    print(f"[pipeline] ADQL query:\n{adql}\n")

    try:
        Gaia.MAIN_GAIA_TABLE = "gaiadr3.gaia_source"
        Gaia.ROW_LIMIT = QUERY_LIMIT

        job = Gaia.launch_job(
            query=adql,
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
            source_id = str(int(row["source_id"]))
        except (KeyError, ValueError, TypeError) as exc:
            print(f"  [skip] Malformed row (source_id={row.get('source_id', '?')}): {exc}")
            continue

        ra = maybe_float(row["ra"])
        dec = maybe_float(row["dec"])
        parallax = maybe_float(row["parallax"])
        temperature = maybe_float(row["teff_gspphot"])
        phot_g_mean_mag = maybe_float(row["phot_g_mean_mag"])
        parallax_error = maybe_float(row["parallax_error"])
        bp_rp = maybe_float(row["bp_rp"])

        if parallax is None or parallax <= 0:
            print(f"  [skip] source_id={source_id} — invalid parallax ({parallax})")
            continue
        if ra is None or dec is None:
            print(f"  [skip] source_id={source_id} — invalid coordinates (RA={ra}, DEC={dec})")
            continue
        if require_teff and (temperature is None or temperature <= 0):
            print(f"  [skip] source_id={source_id} — invalid temperature ({temperature})")
            continue
        if temperature is not None and temperature <= 0:
            temperature = None

        rows.append({
            "source_id": source_id,
            "ra": ra,
            "dec": dec,
            "parallax": parallax,
            "temperature": temperature,
            "phot_g_mean_mag": phot_g_mean_mag,
            "parallax_error": parallax_error,
            "bp_rp": bp_rp,
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
    distance_pc = parallax_to_pc(parallax)   # 1000 / parallax_mas  → parsecs
    distance_ly = pc_to_ly(distance_pc)      # distance_pc * 3.26156 → light-years

    # ── Cartesian position ────────────────────────────────────────────────────
    x, y, z = equatorial_to_cartesian(ra, dec, distance_pc)

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
        "temperature":   round(temperature, 4) if temperature is not None else None,
        "phot_g_mean_mag": round(raw["phot_g_mean_mag"], 6) if raw["phot_g_mean_mag"] is not None else None,
        "parallax_error": round(raw["parallax_error"], 6) if raw["parallax_error"] is not None else None,
        "bp_rp":         round(raw["bp_rp"], 6) if raw["bp_rp"] is not None else None,

        # ── Derived distances ─────────────────────────────────────────────────
        # distance_pc = 1000 / parallax_mas   (parallax definition)
        # distance_ly = distance_pc * 3.26156 (IAU 2012 exact)
        "distance_pc":   round(distance_pc, 6),
        "distance_ly":   round(distance_ly, 4),
        "selection":     raw["selection"],

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
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(stars, fh, indent=2, ensure_ascii=False)
    print(f"[pipeline] Wrote {len(stars)} stars -> {path}")


def write_csv(stars: list[dict], path: Path) -> None:
    """Write the star catalog as a flat CSV (aliases joined with '|')."""
    if not stars:
        return

    path.parent.mkdir(parents=True, exist_ok=True)

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
    for i, s in enumerate(stars):
        sid = s.get("source_id", f"index_{i}")

        if s["parallax"] <= 0:
            raise ValueError(f"Star {sid} has non-positive parallax={s['parallax']} mas.")

        if s.get("selection") == "nearest" and s["parallax"] <= PARALLAX_MIN_MAS:
            raise ValueError(
                f"Star {sid} has parallax={s['parallax']} mas, "
                f"which is ≤ {PARALLAX_MIN_MAS} mas filter threshold."
            )

        if s["temperature"] is not None and s["temperature"] <= 0:
            raise ValueError(f"Star {sid} has non-positive temperature={s['temperature']} K.")

        if s["distance_pc"] <= 0:
            raise ValueError(f"Star {sid} has non-positive distance_pc={s['distance_pc']} pc.")

        expected_pc = 1000.0 / s["parallax"]
        if abs(s["distance_pc"] - expected_pc) > 1e-3:
            raise ValueError(
                f"Star {sid}: distance_pc={s['distance_pc']:.6f} does not match "
                f"1000/parallax={expected_pc:.6f}."
            )

    nearest_count = sum(1 for s in stars if s.get("selection") == "nearest")
    if nearest_count < TARGET_COUNT:
        raise ValueError(
            f"Expected at least {TARGET_COUNT} nearest stars, got {nearest_count}. "
            "Increase QUERY_LIMIT or check the Gaia archive."
        )

    print(
        f"[pipeline] Validation passed: {len(stars)} stars "
        f"({nearest_count} nearest), all parallax > 0."
    )


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("  StarScope — Gaia DR3 Data Pipeline")
    print("=" * 60)

    # 1. Query Gaia archive: nearest sample + curated IDs
    try:
        nearest_rows = query_gaia(ADQL_QUERY, require_teff=True)
        curated_rows = query_gaia(ADQL_CURATED, require_teff=False)
    except RuntimeError as exc:
        print(f"\n[ERROR] {exc}")
        sys.exit(1)

    nearest_rows = nearest_rows[:TARGET_COUNT]
    for row in nearest_rows:
        row["selection"] = "nearest"
    nearest_ids = {row["source_id"] for row in nearest_rows}
    print(f"[pipeline] Keeping top {len(nearest_rows)} nearest stars.")

    merged_rows = list(nearest_rows)
    extra_curated = 0
    for row in curated_rows:
        if row["source_id"] in nearest_ids:
            continue
        row["selection"] = "curated"
        merged_rows.append(row)
        extra_curated += 1
    print(f"[pipeline] Added {extra_curated} curated stars not already in the nearest sample.")

    merged_rows.sort(key=lambda row: row["parallax"], reverse=True)

    # 2. Build enriched catalog entries
    retrieved_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stars = []
    for raw in merged_rows:
        try:
            entry = build_star_entry(raw, retrieved_utc)
            stars.append(entry)
        except Exception as exc:
            print(f"  [skip] source_id={raw.get('source_id', '?')} — enrichment failed: {exc}")

    if not stars:
        print("[ERROR] No stars could be built. Aborting.")
        sys.exit(1)

    # 3. Validate
    try:
        validate_catalog(stars)
    except ValueError as exc:
        print(f"\n[ERROR] Validation failed: {exc}")
        sys.exit(1)

    # 4. Write outputs
    write_json(stars, JSON_OUT)
    write_csv(stars,  CSV_OUT)

    # 5. Print summary table
    print("\n" + "=" * 70)
    print(f"  Catalog Summary  ({len(stars)} stars, Gaia DR3)")
    print("=" * 70)
    header = (
        f"{'#':>2}  {'Name':<22}  {'Sel':<8}  {'Parallax (mas)':>14}  "
        f"{'Dist (ly)':>10}  {'T_eff (K)':>10}  {'G mag':>7}"
    )
    print(header)
    print("-" * len(header))
    for i, s in enumerate(stars, 1):
        teff = f"{s['temperature']:.1f}" if s["temperature"] is not None else "—"
        gmag = f"{s['phot_g_mean_mag']:.2f}" if s["phot_g_mean_mag"] is not None else "—"
        print(
            f"{i:>2}  {s['name']:<22}  {s['selection']:<8}  {s['parallax']:>14.3f}  "
            f"{s['distance_ly']:>10.3f}  {teff:>10}  {gmag:>7}"
        )

    print("=" * 60)
    print(f"\nDone! Files written to:\n  {JSON_OUT}\n  {CSV_OUT}")


if __name__ == "__main__":
    main()

