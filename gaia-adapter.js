// =========================================================
// STARSCOPE
// gaia-adapter.js
// Gaia DR3 Static Catalog Adapter
// =========================================================

const DEFAULT_CATALOG_URL = "./gaia-stars-v1.json";

/**
 * Clamp number to a range.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert effective temperature (Kelvin) to an approximate RGB color.
 *
 * This is a visual approximation based on color temperature.
 * It is NOT a physical Gaia color measurement.
 */
function kelvinToRgb(kelvin) {
  const temperature = Math.max(1000, Math.min(40000, kelvin));
  const temp = temperature / 100;

  let red;
  let green;
  let blue;

  if (temp <= 66) {
    red = 255;

    green =
      99.4708025861 * Math.log(temp) -
      161.1195681661;

    if (temp <= 19) {
      blue = 0;
    } else {
      blue =
        138.5177312231 * Math.log(temp - 10) -
        305.0447927307;
    }
  } else {
    red =
      329.698727446 *
      Math.pow(temp - 60, -0.1332047592);

    green =
      288.1221695283 *
      Math.pow(temp - 60, -0.0755148492);

    blue = 255;
  }

  return {
    r: Math.round(clamp(red, 0, 255)),
    g: Math.round(clamp(green, 0, 255)),
    b: Math.round(clamp(blue, 0, 255))
  };
}

/**
 * Convert RGB object to HEX.
 */
function rgbToHex({ r, g, b }) {
  return (
    "#" +
    [r, g, b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Build a CSS radial-gradient for the procedural star.
 */
function buildStarGradient(rgb, hex) {
  return `
    radial-gradient(
      circle at 32% 30%,
      #ffffff 8%,
      rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.65) 38%,
      ${hex} 100%
    )
  `.replace(/\s+/g, " ").trim();
}

/**
 * Build glow color.
 */
function buildGlow(rgb, alpha = 0.72) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Rough temperature band.
 *
 * IMPORTANT:
 * This is NOT replacing an actual spectral type.
 * It is only a UI classification based on temperature.
 */
function getTemperatureBand(temperature) {
  if (temperature < 3700) return "M";
  if (temperature < 5200) return "K";
  if (temperature < 6000) return "G";
  if (temperature < 7500) return "F";
  if (temperature < 10000) return "A";
  if (temperature < 30000) return "B";
  return "O";
}

/**
 * Convert parallax in milliarcseconds to parsecs.
 *
 * d(pc) = 1000 / parallax(mas)
 */
function parallaxToPc(parallaxMas) {
  if (!Number.isFinite(parallaxMas) || parallaxMas <= 0) {
    throw new Error(`Invalid parallax: ${parallaxMas}`);
  }

  return 1000 / parallaxMas;
}

/**
 * Parsecs -> light years.
 */
function pcToLy(parsec) {
  return parsec * 3.26156;
}

/**
 * Convert equatorial coordinates + distance to
 * Cartesian coordinates.
 *
 * RA/DEC are in degrees.
 * Distance is in parsecs.
 *
 * Output:
 * x, y, z
 */
function equatorialToCartesian(raDeg, decDeg, distancePc) {
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  return {
    x: distancePc * Math.cos(decRad) * Math.cos(raRad),
    y: distancePc * Math.cos(decRad) * Math.sin(raRad),
    z: distancePc * Math.sin(decRad)
  };
}

/**
 * Convert decimal degrees to display coordinates.
 */
function formatCoords(raDeg, decDeg) {
  // ---------- RA ----------
  const raHours = raDeg / 15;

  const hours = Math.floor(raHours);

  const minuteFloat = (raHours - hours) * 60;
  const minutes = Math.floor(minuteFloat);

  const secondFloat = (minuteFloat - minutes) * 60;
  const seconds = Math.round(secondFloat);

  // Handle rounding into 60 seconds.
  let finalHours = hours;
  let finalMinutes = minutes;
  let finalSeconds = seconds;

  if (finalSeconds >= 60) {
    finalSeconds = 0;
    finalMinutes += 1;
  }

  if (finalMinutes >= 60) {
    finalMinutes = 0;
    finalHours += 1;
  }

  // ---------- DEC ----------
  const sign = decDeg >= 0 ? "+" : "-";
  const decAbs = Math.abs(decDeg);

  const degrees = Math.floor(decAbs);

  const decMinuteFloat = (decAbs - degrees) * 60;
  const decMinutes = Math.floor(decMinuteFloat);

  const decSecondFloat = (decMinuteFloat - decMinutes) * 60;
  const decSeconds = Math.round(decSecondFloat);

  return (
    `RA ${finalHours.toString().padStart(2, "0")}h ` +
    `${finalMinutes.toString().padStart(2, "0")}m ` +
    `${finalSeconds.toString().padStart(2, "0")}s · ` +
    `DEC ${sign}${degrees.toString().padStart(2, "0")}° ` +
    `${decMinutes.toString().padStart(2, "0")}′ ` +
    `${decSeconds.toString().padStart(2, "0")}″`
  );
}

/**
 * Validate one raw catalog entry.
 */
function validateStar(star, index) {
  if (!star || typeof star !== "object") {
    throw new Error(`Catalog item ${index} is not an object.`);
  }

  const requiredFields = [
    "id",
    "name",
    "source_id",
    "ra",
    "dec",
    "parallax",
    "temperature"
  ];

  for (const field of requiredFields) {
    if (!(field in star)) {
      throw new Error(
        `Catalog item ${index} (${star.name ?? "unknown"}) is missing "${field}".`
      );
    }
  }

  if (!Number.isFinite(Number(star.ra))) {
    throw new Error(`Invalid RA for ${star.name}.`);
  }

  if (!Number.isFinite(Number(star.dec))) {
    throw new Error(`Invalid DEC for ${star.name}.`);
  }

  if (!Number.isFinite(Number(star.parallax)) || Number(star.parallax) <= 0) {
    throw new Error(`Invalid parallax for ${star.name}.`);
  }

  if (
    !Number.isFinite(Number(star.temperature)) ||
    Number(star.temperature) <= 0
  ) {
    throw new Error(`Invalid temperature for ${star.name}.`);
  }
}

/**
 * Normalize and enrich one raw Gaia record.
 */
function normalizeStar(star, index) {
  validateStar(star, index);

  const ra = Number(star.ra);
  const dec = Number(star.dec);
  const parallax = Number(star.parallax);
  const temperature = Number(star.temperature);

  const distancePc = parallaxToPc(parallax);
  const distanceLy = pcToLy(distancePc);

  const position = equatorialToCartesian(
    ra,
    dec,
    distancePc
  );

  const temperatureBand =
    getTemperatureBand(temperature);

  const rgb = kelvinToRgb(temperature);
  const colorHex = rgbToHex(rgb);

  const sourceId = String(star.source_id);

  return {
    // Original catalog fields
    id: String(star.id),
    name: String(star.name),
    source_id: sourceId,

    aliases: Array.isArray(star.aliases)
      ? star.aliases.map(String)
      : [],

    ra,
    dec,
    parallax,
    temperature,

    // Derived astronomy values
    distancePc,
    distanceLy,

    // Conditional Cartesian coordinates
    x: position.x,
    y: position.y,
    z: position.z,

    position: {
      x: position.x,
      y: position.y,
      z: position.z
    },

    // Approximate temperature classification
    temperatureBand,

    // Visual data
    colorHex,
    colorRgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    glow: buildGlow(rgb),
    dotColor: colorHex,
    bg: buildStarGradient(rgb, colorHex),

    // UI-ready fields
    kicker: `GAIA DR3 // T_EFF ${Math.round(temperature).toLocaleString()} K`,

    category: `${temperatureBand}-TYPE TEMPERATURE BAND`,

    designation: `Gaia DR3 ${sourceId}`,

    code: `TARGET // GAIA-${sourceId.slice(-4)}`,

    coords:
      `COORDINATES // ${formatCoords(ra, dec)}`,

    temp:
      `${temperature.toLocaleString(undefined, {
        maximumFractionDigits: 0
      })} K`,

    dist:
      `${distanceLy.toFixed(1)} LY`,

    distance:
      `${distancePc.toFixed(3)} pc / ${distanceLy.toFixed(1)} LY`,

    // Not present in our minimal JSON dataset.
    // Keep them explicitly empty instead of inventing values.
    lum: "—",
    mass: "—"
  };
}

/**
 * Main loader.
 *
 * Example:
 *
 * const stars = await loadGaiaStars();
 */
export async function loadGaiaStars(
  url = DEFAULT_CATALOG_URL
) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}`
      );
    }

    const rawCatalog = await response.json();

    if (!Array.isArray(rawCatalog)) {
      throw new Error(
        "Gaia catalog JSON must contain an array."
      );
    }

    const processedStars = rawCatalog.map(
      (star, index) => normalizeStar(star, index)
    );

    if (processedStars.length === 0) {
      throw new Error("Gaia catalog is empty.");
    }

    return processedStars;
  } catch (error) {
    console.error(
      "[StarScope] Failed to load Gaia catalog:",
      error
    );

    const wrappedError = new Error(
      `Unable to load Gaia catalog: ${error.message}`
    );

    wrappedError.cause = error;

    throw wrappedError;
  }
}

/**
 * Optional exports for testing or future use.
 */
export {
  kelvinToRgb,
  rgbToHex,
  getTemperatureBand,
  parallaxToPc,
  pcToLy,
  equatorialToCartesian,
  formatCoords
};