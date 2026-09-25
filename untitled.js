/**
 * gaia-adapter.js
 * Адаптер для загрузки и нормализации каталога Gaia DR3 для StarScope Observatory HUD.
 * Поддерживает множественные пути поиска JSON и встроенный fallback на случай CORS / file://
 */

function raToHms(raDeg) {
  const hours = raDeg / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor(((hours - h) * 60 - m) * 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function decToDms(decDeg) {
  const sign = decDeg >= 0 ? "+" : "−";
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.floor(((abs - d) * 60 - m) * 60);
  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

function getSpectralInfo(teff) {
  if (teff >= 30000) {
    return {
      band: "O",
      kicker: "SPECTRAL CLASS O5 V",
      category: "BLUE SUPERGIANT",
 #ffffff 10%, #bfdbfe 45%, #3b82f6 100%)",
      glow: "rgba(59, 130, 246, 0.85)",
      dotColor: "#60a5fa",
      mass: "16.0 M☉",
      lum: "30,000 L☉"
    };
  } else if (teff >= 10000) {
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
  } else if (teff >= 7500) {S
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
  } else if (teff >= 6000) {
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
  } else if (teff >= 5200) {
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
  } else if (teff >= 3700) {
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
  } else {
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
}

// Резервный каталог для автономной работы и обхода CORS в file://
const FALLBACK_GAIA_STARS = [
  {
    "id": "proxima-centauri",
    "name": "Proxima Centauri",
    "source_id": "5853498713190525696",
    "aliases": ["Alpha Centauri C", "GJ 551", "HIP 70890"],
    "ra": 217.4289,
    "dec": -62.6795,
    "parallax": 768.5,
    "temperature": 3042,
    "distance_pc": 1.301,
    "distance_ly": 4.24
  },
  {
    "id": "sirius-a",
    "name": "Sirius A",
    "source_id": "2947050466531873024",
    "aliases": ["Alpha Canis Majoris", "GJ 244", "HIP 32349"],
    "ra": 101.2872,
    "dec": -16.7161,
    "parallax": 379.21,
    "temperature": 9940,
    "distance_pc": 2.637,
    "distance_ly": 8.6
  },
  {
    "id": "canopus",
    "name": "Canopus",
    "source_id": "5297260555318610560",
    "aliases": ["Alpha Carinae", "HD 45348", "HIP 30438"],
    "ra": 95.9879,
    "dec": -52.6957,
    "parallax": 10.43,
    "temperature": 7350,
    "distance_pc": 95.88,
    "distance_ly": 310.0
  },
  {
    "id": "vega",
    "name": "Vega",
    "source_id": "2103525164161884416",
    "aliases": ["Alpha Lyrae", "GJ 721", "HIP 91262"],
    "ra": 279.2347,
    "dec": 38.7837,
    "parallax": 130.23,
    "temperature": 9600,
    "distance_pc": 7.68,
    "distance_ly": 25.04
  },
  {
    "id": "rigel",
    "name": "Rigel",
    "source_id": "3209252067727144448",
    "aliases": ["Beta Orionis", "HIP 24436"],
    "ra": 78.6345,
    "dec": -8.2016,
    "parallax": 3.78,
    "temperature": 12100,
    "distance_pc": 264.55,
    "distance_ly": 860.0
  },
  {
    "id": "betelgeuse",
    "name": "Betelgeuse",
    "source_id": "3226343555462520448",
    "aliases": ["Alpha Orionis", "HIP 27989"],
    "ra": 88.7929,
    "dec": 7.4071,
    "parallax": 5.95,
    "temperature": 3600,
    "distance_pc": 168.07,
    "distance_ly": 548.0
  },
  {
    "id": "arcturus",
    "name": "Arcturus",
    "source_id": "1459468903525942400",
    "aliases": ["Alpha Boötis", "HIP 69673"],
    "ra": 213.9153,
    "dec": 19.1824,
    "parallax": 88.83,
    "temperature": 4286,
    "distance_pc": 11.26,
    "distance_ly": 36.7
  }
];

export async function loadGaiaStars(jsonPath = "./gaia-stars-v2.json") {
  let rawList = null;

  const candidatePaths = [
    jsonPath,
    "./gaia-stars-v2.json",
    "gaia-stars-v2.json",
    "/gaia-stars-v2.json",
    "./public/gaia-stars-v2.json"
  ];

  for (const path of candidatePaths) {
    try {
      const response = await fetch(path);
      if (response && response.ok) {
        rawList = await response.json();
        if (Array.isArray(rawList) && rawList.length > 0) {
          break;
        }
      }
    } catch {
      // Идём к следующему пути
    }
  }

  if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
    console.warn("[GaiaAdapter] Fetch unreachable or blocked by CORS. Using fallback catalog.");
    rawList = FALLBACK_GAIA_STARS;
  }

  return rawList.map((star) => {
    const teff = Number(star.temperature || 5000);
    const spec = getSpectralInfo(teff);
    const distLy = Number(star.distance_ly || (star.distance_pc ? star.distance_pc * 3.26156 : 10));
    const cleanId = (star.id || star.name).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const sourceSuffix = star.source_id ? String(star.source_id).slice(-4) : "0001";

    let kicker = spec.kicker;
    let category = spec.category;
    let mass = spec.mass;
    let lum = spec.lum;

    if (star.id === "canopus" || star.name === "Canopus") {
      kicker = "SPECTRAL CLASS F0 II";
      category = "BRIGHT GIANT";
      mass = "8.0 M☉";
      lum = "10,700 L☉";
    } else if (star.id === "sirius-a" || star.name.includes("Sirius")) {
      kicker = "SPECTRAL CLASS A1 V";
      category = "MAIN SEQUENCE";
      mass = "2.06 M☉";
      lum = "25.4 L☉";
    } else if (star.id === "proxima-centauri") {
      kicker = "SPECTRAL CLASS M5.5 Ve";
      category = "FLARE STAR / RED DWARF";
      mass = "0.12 M☉";
      lum = "0.0017 L☉";
    } else if (star.id === "rigel" || star.name.includes("Rigel")) {
      kicker = "SPECTRAL CLASS B8 Ia";
      category = "BLUE-WHITE SUPERGIANT";
      mass = "21.0 M☉";
      lum = "120,000 L☉";
    } else if (star.id === "betelgeuse" || star.name.includes("Betelgeuse")) {
      kicker = "SPECTRAL CLASS M1-2 Ia";
      category = "RED SUPERGIANT";
      mass = "16.5 M☉";
      lum = "126,000 L☉";
    }

    const aliases = star.aliases && star.aliases.length > 0 ? star.aliases.join(" · ") : `HIP ${cleanId}`;

    return {
      ...star,
      temperature: teff,
      temperatureBand: spec.band,
      kicker,
      category,
      mass,
      lum,
      designation: `${aliases} · Gaia ${star.source_id || ''}`.trim().replace(/^·\s*|·\s*$/g, ''),
      code: `TARGET // ${cleanId.slice(0, 8)}-${sourceSuffix}`,
      coords: `COORDINATES // RA ${raToHms(star.ra || 0)} · DEC ${decToDms(star.dec || 0)}`,
      temp: `${Math.round(teff).toLocaleString()} K`,
      dist: distLy < 15 ? `${distLy.toFixed(2)} LY` : `${Math.round(distLy)} LY`,
      bg: spec.bg,
      glow: spec.glow,
      dotColor: spec.dotColor
    };
  });
}