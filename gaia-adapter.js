```js
/**
 * gaia-adapter.js
 * Adapter for loading and normalizing the verified Gaia DR3 catalog
 * for the StarScope Observatory HUD.
 */

function raToHms(raDeg) {
  const hours = raDeg / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor(((hours - h) * 60 - m) * 60);

  return `${String(h).padStart(2, "0")}h ${String(m).padStart(
    2,
    "0"
  )}m ${String(s).padStart(2, "0")}s`;
}

function decToDms(decDeg) {
  const sign = decDeg >= 0 ? "+" : "−";
  const abs = Math.abs(decDeg);

  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.floor(((abs - d) * 60 - m) * 60);

  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(
    2,
    "0"
  )}′ ${String(s).padStart(2, "0")}″`;
}

function getSpectralInfo(teff) {
  if (teff >= 30000) {
    return {
      band: "O",
      kicker: "SPECTRAL CLASS O5 V",
      category: "BLUE SUPERGIANT",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 10%, #bfdbfe 45%, #3b82f6 100%)",
      glow: "rgba(59, 130, 246, 0.85)",
      dotColor: "#60a5fa",
      mass: "16.0 M☉",
      lum: "30,000 L☉"
    };
  }

  if (teff >= 10000) {
    return {
      band: "B",
      kicker: "SPECTRAL CLASS B8 Ia",
      category: "BLUE GIANT",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 15%, #c7d2fe 45%, #6366f1 100%)",
      glow: "rgba(99, 102, 241, 0.8)",
      dotColor: "#818cf8",
      mass: "18.0 M☉",
      lum: "12,000 L☉"
    };
  }

  if (teff >= 7500) {
    return {
      band: "A",
      kicker: "SPECTRAL CLASS A1 V",
      category: "MAIN SEQUENCE",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 20%, #e0f2fe 50%, #38bdf8 100%)",
      glow: "rgba(56, 189, 248, 0.78)",
      dotColor: "#6fe7dd",
      mass: "2.1 M☉",
      lum: "25.4 L☉"
    };
  }

  if (teff >= 6000) {
    return {
      band: "F",
      kicker: "SPECTRAL CLASS F0 II",
      category: "BRIGHT GIANT",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 20%, #fef08a 50%, #eab308 100%)",
      glow: "rgba(234, 179, 8, 0.75)",
      dotColor: "#fde047",
      mass: "1.4 M☉",
      lum: "6.2 L☉"
    };
  }

  if (teff >= 5200) {
    return {
      band: "G",
      kicker: "SPECTRAL CLASS G2 V",
      category: "YELLOW DWARF",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 15%, #fed7aa 45%, #f97316 100%)",
      glow: "rgba(249, 115, 22, 0.78)",
      dotColor: "#fb923c",
      mass: "1.0 M☉",
      lum: "1.0 L☉"
    };
  }

  if (teff >= 3700) {
    return {
      band: "K",
      kicker: "SPECTRAL CLASS K2 V",
      category: "ORANGE DWARF",
      bg: "radial-gradient(circle at 32% 30%, #ffedd5 15%, #fdba74 45%, #ea580c 100%)",
      glow: "rgba(234, 88, 12, 0.75)",
      dotColor: "#f97316",
      mass: "0.78 M☉",
      lum: "0.28 L☉"
    };
  }

  return {
    band: "M",
    kicker: "SPECTRAL CLASS M5.5 Ve",
    category: "RED DWARF",
    bg: "radial-gradient(circle at 32% 30%, #fee2e2 15%, #fca5a5 45%, #ef4444 100%)",
    glow: "rgba(239, 68, 68, 0.75)",
    dotColor: "#f87171",
    mass: "0.12 M☉",
    lum: "0.0017 L☉"
  };
}

export async function loadGaiaStars(jsonPath = "./gaia-stars-v1.json") {
  const response = await fetch(jsonPath);

  if (!response.ok) {
    throw new Error(
      `[GaiaAdapter] HTTP error! status: ${response.status}`
    );
  }

  const rawList = await response.json();

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error(
      "[GaiaAdapter] Catalog is empty or invalid JSON array."
    );
  }

  return rawList.map((star) => {
    const teff = Number(star.temperature || 5000);
    const spec = getSpectralInfo(teff);

    // Calculate distance from parallax when distance_ly is not provided.
    const parallax = Number(star.parallax) || 0;

    const computedLy =
      parallax > 0
        ? (1000 / parallax) * 3.26156
        : null;

    const distLy = Number(star.distance_ly || computedLy);

    const rawId = star.id || star.name || "unknown";

    const cleanId = String(rawId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    const sourceSuffix = star.source_id
      ? String(star.source_id).slice(-4)
      : "0001";

    let kicker = spec.kicker;
    let category = spec.category;
    let mass = spec.mass;
    let lum = spec.lum;

    // Temporary presentation metadata for known stars.
    // These are visual/UI labels and will be cleaned up in a later step.
    if (star.id === "canopus" || star.name === "Canopus") {
      kicker = "SPECTRAL CLASS F0 II";
      category = "BRIGHT GIANT";
      mass = "8.0 M☉";
      lum = "10,700 L☉";
    } else if (
      star.id === "sirius-a" ||
      (typeof star.name === "string" && star.name.includes("Sirius"))
    ) {
      kicker = "SPECTRAL CLASS A1 V";
      category = "MAIN SEQUENCE";
      mass = "2.06 M☉";
      lum = "25.4 L☉";
    } else if (star.id === "proxima-centauri") {
      kicker = "SPECTRAL CLASS M5.5 Ve";
      category = "FLARE STAR / RED DWARF";
      mass = "0.12 M☉";
      lum = "0.0017 L☉";
    }

    const aliases =
      Array.isArray(star.aliases) && star.aliases.length > 0
        ? star.aliases.join(" · ")
        : `HIP ${cleanId}`;

    const designation = `${aliases} · Gaia ${
      star.source_id || ""
    }`
      .trim()
      .replace(/^·\s*|\s*·$/g, "");

    const coords = `COORDINATES // RA ${raToHms(
      Number(star.ra) || 0
    )} · DEC ${decToDms(Number(star.dec) || 0)}`;

    return {
      ...star,

      temperature: teff,
      temperatureBand: spec.band,

      kicker,
      category,
      mass,
      lum,

      designation,

      code: `TARGET // ${cleanId.slice(0, 8)}-${sourceSuffix}`,

      coords,

      temp: `${Math.round(teff).toLocaleString()} K`,

      dist:
        Number.isFinite(distLy) && distLy > 0
          ? distLy < 15
            ? `${distLy.toFixed(2)} LY`
            : `${Math.round(distLy)} LY`
          : "—",

      bg: spec.bg,
      glow: spec.glow,
      dotColor: spec.dotColor
    };
  });
}