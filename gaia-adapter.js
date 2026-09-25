





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
      band: "0",
      kicker: "SPECTRAL CLASS 05 V",
      category: "BLUE SUPERGIANT",
      bg: "radial-gradient(circle at 32% 30%, #ffffff 10%, #bfdbfe 45%, #3b82f6 100%)",
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
    } else if (teff >= 7500) {
    return {
    band: "A",
    kicker: "SPECTRAL CLASS A1 V",
    SS