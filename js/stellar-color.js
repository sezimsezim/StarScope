const TEMPERATURE_STOPS = [
  { value: 1800, color: [255, 112, 64] },
  { value: 2500, color: [255, 145, 89] },
  { value: 3500, color: [255, 190, 133] },
  { value: 5000, color: [255, 231, 203] },
  { value: 6500, color: [255, 248, 239] },
  { value: 10000, color: [205, 223, 255] },
  { value: 20000, color: [165, 195, 255] },
  { value: 40000, color: [147, 181, 255] }
];

const BP_RP_STOPS = [
  { value: -0.5, color: [171, 202, 255] },
  { value: 0, color: [213, 228, 255] },
  { value: 0.8, color: [255, 246, 226] },
  { value: 1.6, color: [255, 211, 164] },
  { value: 2.8, color: [255, 158, 105] },
  { value: 4, color: [225, 101, 75] },
  { value: 5.5, color: [190, 73, 65] }
];

const UNKNOWN_COLOR = "#aab7c8";

function interpolate(stops, value, logarithmic = false) {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (value <= first.value) return first.color;
  if (value >= last.value) return last.color;

  for (let index = 1; index < stops.length; index += 1) {
    const upper = stops[index];
    if (value > upper.value) continue;

    const lower = stops[index - 1];
    const start = logarithmic ? Math.log(lower.value) : lower.value;
    const end = logarithmic ? Math.log(upper.value) : upper.value;
    const point = logarithmic ? Math.log(value) : value;
    const fraction = (point - start) / (end - start);
    return lower.color.map((channel, channelIndex) =>
      Math.round(channel + (upper.color[channelIndex] - channel) * fraction)
    );
  }

  return last.color;
}

function toHex([red, green, blue]) {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Return a display-only stellar hue. Valid Gaia Teff is authoritative; BP-RP
 * is a measured photometric color index and is only a fallback when Teff is
 * unavailable because extinction can redden BP-RP independently of Teff.
 */
export function getStellarAppearance(temperature, bpRp) {
  const teff = temperature === null || temperature === undefined || temperature === ""
    ? NaN
    : Number(temperature);
  if (Number.isFinite(teff) && teff >= 1000 && teff <= 50000) {
    return {
      color: toHex(interpolate(TEMPERATURE_STOPS, teff, true)),
      source: "teff",
      label: "Approximate hue from Gaia Teff"
    };
  }

  const colorIndex = bpRp === null || bpRp === undefined || bpRp === ""
    ? NaN
    : Number(bpRp);
  if (Number.isFinite(colorIndex) && colorIndex >= -1.5 && colorIndex <= 8) {
    return {
      color: toHex(interpolate(BP_RP_STOPS, colorIndex)),
      source: "bp_rp",
      label: "Approximate photometric hue from BP−RP; Teff unavailable"
    };
  }

  return {
    color: UNKNOWN_COLOR,
    source: "unknown",
    label: "Stellar hue unavailable"
  };
}
