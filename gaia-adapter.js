/**
 * gaia-adapter.js
 * Adapter for loading and normalizing the verified Gaia DR3 catalog
 * for the StarScope Observatory HUD.
 *
 * Measurements come from the catalog file produced by fetch_gaia_stars.py.
 * Distance is derived from parallax. Missing values stay "—".
 */

const PC_TO_LY = 3.26156;
const UNKNOWN_STYLE = {
  band: "?",
  bg: "rgba(255, 255, 255, 0.1)",
  glow: "rgba(255, 255, 255, 0.2)",
  dotColor: "#8c9bb1"
};

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
  const sign = Number(decDeg) >= 0 ? "+" : "−";
  const totalSeconds = Math.round(Math.abs(Number(decDeg)) * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

function getSpectralInfo(teff) {
  if (teff === null) return { ...UNKNOWN_STYLE };

  if (teff >= 30000) {
    return {
      band: "O",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 10%, #bfdbfe 45%, #3b82f6 100%)",
      glow: "rgba(59, 130, 246, 0.85)",
      dotColor: "#60a5fa"
    };
  }

  if (teff >= 10000) {
    return {
      band: "B",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 15%, #c7d2fe 45%, #6366f1 100%)",
      glow: "rgba(99, 102, 241, 0.8)",
      dotColor: "#818cf8"
    };
  }

  if (teff >= 7500) {
    return {
      band: "A",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 20%, #e0f2fe 50%, #38bdf8 100%)",
      glow: "rgba(56, 189, 248, 0.78)",
      dotColor: "#6fe7dd"
    };
  }

  if (teff >= 6000) {
    return {
      band: "F",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 20%, #fef08a 50%, #eab308 100%)",
      glow: "rgba(234, 179, 8, 0.75)",
      dotColor: "#fde047"
    };
  }

  if (teff >= 5200) {
    return {
      band: "G",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 15%, #fed7aa 45%, #f97316 100%)",
      glow: "rgba(249, 115, 22, 0.78)",
      dotColor: "#fb923c"
    };
  }

  if (teff >= 3700) {
    return {
      band: "K",
      bg: "radial-gradient(circle at 32% 30%, #ffedd5 15%, #fdba74 45%, #ea580c 100%)",
      glow: "rgba(234, 88, 12, 0.75)",
      dotColor: "#f97316"
    };
  }

  return {
    band: "M",
    bg: "radial-gradient(circle at 32% 30%, #fee2e2 15%, #fca5a5 45%, #ef4444 100%)",
    glow: "rgba(239, 68, 68, 0.75)",
    dotColor: "#f87171"
  };
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
  const teff = toNumberOrNull(raw.temperature);
  const parallax = toNumberOrNull(raw.parallax);
  const parallaxError = toNumberOrNull(raw.parallax_error);
  const gmagValue = toNumberOrNull(raw.phot_g_mean_mag);
  const distancePc = toNumberOrNull(raw.distance_pc)
    ?? (parallax && parallax > 0 ? 1000 / parallax : null);
  const distanceLy = toNumberOrNull(raw.distance_ly)
    ?? (distancePc !== null ? distancePc * PC_TO_LY : null);

  const spec = getSpectralInfo(teff);
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
    distance_pc: distancePc,
    distance_ly: distanceLy,
    temperatureBand: spec.band,
    bandLabel: teff === null ? "CLASS UNKNOWN" : `≈ ${spec.band}-TYPE · FROM TEFF`,
    kicker: teff === null ? "CLASS UNKNOWN" : `≈ ${spec.band}-TYPE · FROM TEFF`,
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
    bg: spec.bg,
    glow: spec.glow,
    dotColor: spec.dotColor
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
