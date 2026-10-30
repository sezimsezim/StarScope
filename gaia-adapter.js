import { getStellarAppearance } from "./js/stellar-color.js";

/**
 * gaia-adapter.js
 * Adapter for loading and normalizing the verified Gaia DR3 catalog
 * for the StarScope Observatory HUD.
 *
 * Measurements come from the catalog file produced by fetch_gaia_stars.py.
 * Distance is derived from parallax. Missing values stay "—".
 */

const PC_TO_LY = 3.26156;
function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function raToHms(raDeg) {
  const totalSeconds = Math.round((Number(raDeg) / 15) * 3600);
  const wrapped = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(wrapped / 3600);
  const m = Math.floor((wrapped % 3600) / 60);
  const s = wrapped % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function decToDms(decDeg) {
  const sign = Number(decDeg) >= 0 ? "+" : "-";
  const totalSeconds = Math.round(Math.abs(Number(decDeg)) * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

function getTemperatureBand(teff) {
  if (teff === null) return "?";
  if (teff >= 30000) return "O";
  if (teff >= 10000) return "B";
  if (teff >= 7500) return "A";
  if (teff >= 6000) return "F";
  if (teff >= 5200) return "G";
  if (teff >= 3700) return "K";
  return "M";
}

function formatParallax(parallax, parallaxError) {
  if (parallax === null) return "—";
  const value = parallax.toFixed(2);
  if (parallaxError === null) return `${value} mas`;
  return `${value} ± ${parallaxError.toFixed(2)} mas`;
}

function formatGmag(gmag) {
  if (gmag === null) return "—";
  return gmag.toFixed(2);
}

/** Pure function: raw catalog row -> UI-ready star object. */
export function normalizeStar(raw) {
  const rawTemperature = toNumberOrNull(raw.temperature);
  const teff = rawTemperature !== null && rawTemperature >= 1000 && rawTemperature <= 50000
    ? rawTemperature
    : null;
  const parallax = toNumberOrNull(raw.parallax);
  const parallaxError = toNumberOrNull(raw.parallax_error);
  const gmagValue = toNumberOrNull(raw.phot_g_mean_mag);
  const bpRp = toNumberOrNull(raw.bp_rp);
  const distancePc = toNumberOrNull(raw.distance_pc)
    ?? (parallax && parallax > 0 ? 1000 / parallax : null);
  const distanceLy = toNumberOrNull(raw.distance_ly)
    ?? (distancePc !== null ? distancePc * PC_TO_LY : null);

  const temperatureBand = getTemperatureBand(teff);
  const appearance = getStellarAppearance(teff, bpRp);
  const ra = toNumberOrNull(raw.ra);
  const dec = toNumberOrNull(raw.dec);

  const rawId = raw.id || raw.name || "unknown";
  const cleanId = String(rawId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const sourceSuffix = raw.source_id ? String(raw.source_id).slice(-4) : "0001";

  const aliases = Array.isArray(raw.aliases) ? raw.aliases.filter(Boolean) : [];
  const designation = [...aliases, raw.source_id ? `Gaia DR3 ${raw.source_id}` : null]
    .filter(Boolean)
    .join(" · ");

  const coords = ra !== null && dec !== null
    ? `COORDINATES // RA ${raToHms(ra)} · DEC ${decToDms(dec)}`
    : "COORDINATES // RA — · DEC —";

  const selectionLabel = raw.selection === "nearest"
    ? "NEAREST SAMPLE"
    : raw.selection === "curated"
      ? "CURATED TARGET"
      : "CATALOG TARGET";

  return {
    ...raw,
    temperature: teff,
    parallax,
    parallax_error: parallaxError,
    phot_g_mean_mag: gmagValue,
    bp_rp: bpRp,
    distance_pc: distancePc,
    distance_ly: distanceLy,
    temperatureBand,
    colorSource: appearance.source,
    colorLabel: appearance.label,
    bandLabel: teff === null ? "CLASS UNKNOWN" : `≈ ${temperatureBand}-TYPE · FROM TEFF`,
    kicker: teff === null ? "CLASS UNKNOWN" : `≈ ${temperatureBand}-TYPE · FROM TEFF`,
    category: selectionLabel,
    designation: designation || "—",
    code: `TARGET // ${cleanId.slice(0, 8)}-${sourceSuffix}`,
    coords,
    temp: teff !== null ? `${Math.round(teff).toLocaleString("en-US")} K` : "—",
    dist: distanceLy === null
      ? "—"
      : distanceLy < 15
        ? `${distanceLy.toFixed(2)} LY`
        : `${Math.round(distanceLy)} LY`,
    parallaxDisplay: formatParallax(parallax, parallaxError),
    gmag: formatGmag(gmagValue),
    dotColor: appearance.color
  };
}

export async function loadGaiaStars(jsonPath = "./data/gaia-stars.json") {
  const response = await fetch(jsonPath);

  if (!response.ok) {
    throw new Error(`[GaiaAdapter] HTTP error! status: ${response.status}`);
  }

  const rawList = await response.json();

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error("[GaiaAdapter] Catalog is empty or invalid JSON array.");
  }

  return rawList.map(normalizeStar);
}
