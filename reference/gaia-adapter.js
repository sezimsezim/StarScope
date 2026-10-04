/**
 * gaia-adapter.js - load the static Gaia DR3 catalog and normalize it for the UI.
 *
 * Rules:
 *  - Only values that come from the catalog file (produced by fetch_gaia_stars.py)
 *    are shown as measurements.
 *  - Anything derived here (distance, temperature class, colors) is clearly derived.
 *  - Missing values stay null; the UI renders them as "—". Nothing is invented.
 */

const PC_TO_LY = 3.26156;

/** Convert a value to a finite number, or null (null/""/NaN never become 0). */
function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function raToHms(raDeg) {
  const totalSeconds = Math.round((raDeg / 15) * 3600);
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function decToDms(decDeg) {
  const sign = decDeg >= 0 ? "+" : "−";
  const totalSeconds = Math.round(Math.abs(decDeg) * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

/**
 * Temperature class derived from Teff only (Harvard O/B/A/F/G/K/M boundaries).
 * This is NOT a measured spectral type - the UI must label it "≈ class (from Teff)".
 */
export function getTemperatureClass(teff) {
  if (teff === null) {
    return { band: "?", bg: "rgba(255,255,255,0.1)", glow: "rgba(255,255,255,0.2)", dotColor: "#8c9bb1" };
  }
  if (teff >= 30000) return { band: "O", bg: "radial-gradient(circle at 32% 30%, #ffffff 10%, #bfdbfe 45%, #3b82f6 100%)", glow: "rgba(59, 130, 246, 0.85)", dotColor: "#60a5fa" };
  if (teff >= 10000) return { band: "B", bg: "radial-gradient(circle at 32% 30%, #ffffff 15%, #c7d2fe 45%, #6366f1 100%)", glow: "rgba(99, 102, 241, 0.8)", dotColor: "#818cf8" };
  if (teff >= 7500)  return { band: "A", bg: "radial-gradient(circle at 32% 30%, #ffffff 20%, #e0f2fe 50%, #38bdf8 100%)", glow: "rgba(56, 189, 248, 0.78)", dotColor: "#6fe7dd" };
  if (teff >= 6000)  return { band: "F", bg: "radial-gradient(circle at 32% 30%, #ffffff 20%, #fef08a 50%, #eab308 100%)", glow: "rgba(234, 179, 8, 0.75)", dotColor: "#fde047" };
  if (teff >= 5200)  return { band: "G", bg: "radial-gradient(circle at 32% 30%, #ffffff 15%, #fed7aa 45%, #f97316 100%)", glow: "rgba(249, 115, 22, 0.78)", dotColor: "#fb923c" };
  if (teff >= 3700)  return { band: "K", bg: "radial-gradient(circle at 32% 30%, #ffedd5 15%, #fdba74 45%, #ea580c 100%)", glow: "rgba(234, 88, 12, 0.75)", dotColor: "#f97316" };
  return { band: "M", bg: "radial-gradient(circle at 32% 30%, #fee2e2 15%, #fca5a5 45%, #ef4444 100%)", glow: "rgba(239, 68, 68, 0.75)", dotColor: "#f87171" };
}

/** Pure function: raw catalog row -> UI-ready star object. Easy to unit-test. */
export function normalizeStar(raw) {
  const teff = toNumberOrNull(raw.temperature);
  const parallax = toNumberOrNull(raw.parallax);
  const distancePc = toNumberOrNull(raw.distance_pc) ?? (parallax && parallax > 0 ? 1000 / parallax : null);
  const distanceLy = toNumberOrNull(raw.distance_ly) ?? (distancePc !== null ? distancePc * PC_TO_LY : null);
  const tempClass = getTemperatureClass(teff);
  const ra = toNumberOrNull(raw.ra);
  const dec = toNumberOrNull(raw.dec);

  return {
    ...raw,
    temperature: teff,
    parallax,
    distance_pc: distancePc,
    distance_ly: distanceLy,
    temperatureBand: tempClass.band,
    designation: [...(raw.aliases ?? []), raw.source_id ? `Gaia DR3 ${raw.source_id}` : null]
      .filter(Boolean)
      .join(" · "),
    coords: ra !== null && dec !== null ? `RA ${raToHms(ra)} · DEC ${decToDms(dec)}` : "RA — · DEC —",
    temp: teff !== null ? `${Math.round(teff).toLocaleString("en-US")} K` : "—",
    dist: distanceLy === null ? "—" : distanceLy < 15 ? `${distanceLy.toFixed(2)} LY` : `${Math.round(distanceLy)} LY`,
    bg: tempClass.bg,
    glow: tempClass.glow,
    dotColor: tempClass.dotColor,
  };
}

/** Load the catalog. Throws on failure so the page can show a real error state. */
export async function loadGaiaStars(url = "./data/gaia-stars.json") {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Catalog request failed: HTTP ${response.status} for ${url}`);
  }
  const rawList = await response.json();
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error(`Catalog at ${url} is empty or is not a JSON array`);
  }
  return rawList.map(normalizeStar);
}
