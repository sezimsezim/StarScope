<div align="center">

# StarScope

### An interactive 3D observatory for exploring our stellar neighborhood.

Explore a curated sample of ESA Gaia DR3 stars, inspect their measurements, and see their positions in a Sun-centered 3D map.

[Open the live demo](https://starscope-three.vercel.app/)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=222)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_cartography-black?logo=threedotjs)](https://threejs.org/)
[![Data](https://img.shields.io/badge/Data-ESA_Gaia_DR3-123b68)](https://www.cosmos.esa.int/web/gaia/data-release-3)

</div>

<!-- Capture a short, compressed demo: open Explore, search for Barnard's Star,
select the result, and gently rotate the 3D map. -->
<p align="center"><strong>INSERT HERO DEMO GIF HERE</strong></p>

## Overview

StarScope makes a small, curated set of real stellar measurements easier to explore. Its Landing page introduces the observatory and highlights stars from the same data sample used by Explore. The Explore page adds ranked catalog search, a rotatable Three.js map, a measurement HUD, and direct links to SIMBAD, VizieR, and the ESA Gaia archive.

The project is intentionally built as a lightweight, multi-page application with Vanilla JavaScript ES modules and Vite. It does not use React or another frontend framework.

## Screenshots

<!-- Replace each placeholder with a current screenshot. Use the same crop and
browser zoom for desktop captures; show the selected target on Explore. -->
<table>
  <tr>
    <th>Desktop Explore HUD</th>
    <th>Desktop Landing Page</th>
  </tr>
  <tr>
    <td align="center"><strong>INSERT DESKTOP EXPLORE HUD SCREENSHOT HERE</strong></td>
    <td align="center"><strong>INSERT DESKTOP LANDING SCREENSHOT HERE</strong></td>
  </tr>
  <tr>
    <th>Mobile Explore HUD</th>
    <th>Mobile Landing Page</th>
  </tr>
  <tr>
    <td align="center"><strong>INSERT MOBILE EXPLORE HUD SCREENSHOT HERE</strong></td>
    <td align="center"><strong>INSERT MOBILE LANDING SCREENSHOT HERE</strong></td>
  </tr>
</table>

## Highlights

- **Search real sources:** Find catalog entries by common name, alias, designation, or Gaia `source_id`.
- **Explore in 3D:** Rotate and zoom a Sun-centered equatorial Cartesian map with nearby and full-sample views.
- **Inspect measurements:** View parallax, apparent G magnitude, effective temperature, BP − RP, coordinates, and a clearly labeled parallax-derived distance when available.
- **Follow the source:** Open the selected object in SIMBAD, VizieR, or the ESA Gaia TAP service.
- **Hear a gentle soundscape:** Web Audio provides a quiet ambient pad and soft star-selection tones after a user interaction; audio can be toggled off.
- **Use the mobile Landing page:** Star targets have touch-sized hit areas, the selected-star panel is repositioned to stay within the viewport, and animated target rings respect reduced-motion preferences.

## Mobile observatory and touch UX

The Landing experience is adapted for narrow screens, including 360px-wide layouts and a 390 × 844 viewport. Star markers and the audio toggle have touch targets of at least 44px. The selected-star detail panel measures its content and moves above or below the selected marker as needed, instead of sliding off the edge of the screen.

On touch-sized Landing layouts, target rings pulse in staggered phases to suggest that stars are interactive. The animation is disabled when the device requests reduced motion. Typography and the selected-star measurements are enlarged for mobile readability, and the keyboard-only `ESC` hint is hidden beside the close button.

The Explore page also adapts its layout for narrow screens. Its search trigger and result rows are sized for touch; the map can be rotated and zoomed with touch gestures. The compact map mode and reset controls remain smaller than the Landing touch targets.

The audio is synthesized locally with the Web Audio API. Low-volume sine tones and a slowly faded-in ambient pad are designed to avoid abrupt, harsh clicks. Browsers may wait for a user gesture before allowing audio playback.

## Scientific data and provenance

The static sample is stored in `public/data/gaia-stars.json` and contains **25 Gaia DR3 sources**: 15 nearby stars selected by the pipeline using parallax greater than 200 milliarcseconds, plus a curated group of additional targets. The application reads this local catalog at runtime; opening the pages does not make a live Gaia query.

### Measurements, derived values, and visualization

| Displayed value | Meaning |
|---|---|
| Parallax | Gaia DR3 measurement, in milliarcseconds (mas), with uncertainty when present |
| Apparent G | Gaia DR3 `phot_g_mean_mag`, in magnitudes |
| Effective temperature | Gaia DR3 `teff_gspphot`, in kelvin, when available |
| BP − RP | Gaia DR3 photometric color index, when available |
| Distance | Derived as `distance_pc = 1000 / parallax_mas`; light-years are `distance_pc × 3.26156` |
| Star-map color | A visualization derived primarily from effective temperature, with BP − RP used as a fallback when temperature is unavailable |

Unavailable measurements remain blank (`—`); the interface does not fill them with guessed values. Derived distance is labeled as derived rather than presented as a directly measured Gaia field. BP − RP is a photometric index, not a rendered image of the star's color.

The catalog is curated for nearby-neighborhood exploration, not completeness by apparent brightness. Famous bright stars such as Sirius and Vega are not entries in this sample; their absence here should not be read as a claim that Gaia has no observations of them.

The project includes a verifier that compares catalog source IDs and selected measurements with the live ESA Gaia TAP service. A previous project check recorded **25 of 25 entries verified**; rerun the verifier to check the current catalog against the archive. Network availability and current archive responses affect this check.

```bash
python scripts/verify_catalog.py public/data/gaia-stars.json
```

### 3D coordinate convention

Star positions are represented in parsecs in an equatorial Cartesian frame, with the Solar System barycenter at the origin:

- `+X` points toward RA 0h, DEC 0°.
- `+Y` points toward RA 6h, DEC 0°.
- `+Z` points toward DEC +90°.

The map uses these coordinates for spatial context. It is an interactive visualization of the catalog sample, not a complete or to-scale rendering of the Milky Way.

### External archives

For a selected source, StarScope constructs links to:

- [SIMBAD](https://simbad.cds.unistra.fr/)
- [VizieR Gaia DR3 catalog I/355](https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/355/gaiadr3)
- [ESA Gaia TAP](https://gea.esac.esa.int/tap-server/)

## Run locally

### Prerequisites

- Node.js **20.19+** or **22.12+** for the Vite application.
- Python **3.10+** is optional for the data pipeline and catalog verifier.

The browser app uses its checked-in static JSON catalog and does not require Python to run.

### Install and start

```bash
git clone https://github.com/sezimsezim/StarScope.git
cd StarScope
npm ci
npm run dev
```

Open the local URL printed by Vite. The app has two Vite entry pages: `index.html` (Landing) and `explore.html` (Explore).

### Test and build

```bash
npm test
npm run build
npm run preview
```

`npm test` runs **11 built-in `node:test` unit tests**. They cover query normalization and ranking, Greek-letter and diacritic handling, alias and Gaia source ID search, parallax-derived distance, coordinate formatting, missing measurements, and temperature-driven stellar color mapping.

### Refresh the static catalog (optional)

The Python data pipeline queries Gaia and writes the JSON and CSV catalog files. Install the packages listed in `requirements.txt` before running it:

```bash
python -m pip install -r requirements.txt
python fetch_gaia_stars.py
```

Then verify the generated JSON against the live ESA archive:

```bash
python scripts/verify_catalog.py public/data/gaia-stars.json
```

Both archive querying and verification require an internet connection. The app itself uses the generated static catalog and does not need a connection to Gaia at runtime.

## Project structure

```text
index.html                  Landing page
explore.html                Explore page and catalog-search interface
explore.css                 Explore styles and responsive layouts
js/main.js                  Landing interactions, star markers, and Web Audio
js/search.js                Search normalization and result ranking
js/star-map.js              Three.js star map and camera controls
js/stellar-color.js         Temperature / BP − RP color mapping
gaia-adapter.js             Catalog normalization and coordinate formatting
public/data/gaia-stars.json Static Gaia DR3 sample used by the app
public/data/gaia-stars.csv  CSV view of the catalog
fetch_gaia_stars.py         Optional Gaia data pipeline
scripts/verify_catalog.py   Live ESA Gaia catalog verifier
tests/                      Node.js unit tests
```

## Hackathon submission pitch

> **StarScope turns trusted astronomical data into an approachable, interactive observatory.** Instead of relying on plausible-looking but unverifiable star facts, it connects a curated Gaia DR3 sample to a searchable 3D map, labels derived distances honestly, preserves missing measurements as missing, and links every selected target back to astronomical archives. Its framework-free implementation, responsive Landing experience, and gentle opt-in sonification make the science inviting without disguising what the data can—and cannot—say.

## Before submitting

- [ ] Run `npm test` and `npm run build`.
- [ ] Open the production preview and verify both Landing and Explore.
- [ ] Try a common name, an alias, a Greek-letter designation, a Gaia source ID, and a query with no match.
- [ ] Check map selection, both map modes, camera reset, and archive links.
- [ ] Check the Landing and Explore pages on a real phone and at a narrow desktop viewport.
- [ ] Run the Gaia verifier and report its current result accurately.
- [ ] Replace every “INSERT … HERE” placeholder above with a current GIF or screenshot before publishing the README.
