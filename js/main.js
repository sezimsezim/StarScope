/**
 * STARSCOPE — Main Landing Interface & Telemetry Controller
 * NASA Hackathon Edition // Low-Spec Hardware Optimized
 */

// =============================================================================
// 1. CELESTIAL STARFIELD ENGINE (Optimized 2D Canvas)
// =============================================================================

const canvas = document.getElementById("starfield");

if (canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0;
  let H = 0;
  let stars = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // Memory cap: Limit particle count to protect lower-spec devices (Acer 4GB RAM)
    const count = reducedMotion ? 60 : Math.min(180, Math.floor((W * H) / 11000));
    stars = new Array(count);
    for (let i = 0; i < count; i++) {
      stars[i] = {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
      };
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  let parallaxX = 0;
  let parallaxY = 0;
  window.addEventListener("mousemove", (e) => {
    if (reducedMotion) return;
    parallaxX = (e.clientX / W - 0.5) * 8;
    parallaxY = (e.clientY / H - 0.5) * 8;
  }, { passive: true });

  let t = 0;
  function renderStarfield() {
    ctx.fillStyle = "#04060b";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(parallaxX, parallaxY);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = reducedMotion ? 0.9 : 0.45 + 0.55 * Math.sin(t * 0.0012 * s.speed + s.phase);
      ctx.globalAlpha = tw;
      ctx.fillStyle = "#e7edf5";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    t++;
    requestAnimationFrame(renderStarfield);
  }
  requestAnimationFrame(renderStarfield);
}

// =============================================================================
// 2. ASTRONOMICAL DATA & TELEMETRY CONTROLLER (NASA Precision)
// =============================================================================

/**
 * Scientifically verified celestial targets and coordinates (Gaia DR3 / SIMBAD epoch J2000).
 * UI Collision Fix: Shifted Sirius coordinates from (22vw, 32vh) to (15vw, 22vh) to ensure
 * clean margin clearance from the central "STARSCOPE" hero typography.
 */
const FEATURED_STARS = [
  {
    name: "Sirius",
    desig: "α Canis Majoris A",
    x: 15, // Shifted to upper-left quadrant away from center title
    y: 22,
    dist: "8.6 ly",
    spec: "A1V",
    mag: "−1.46",
    teff: 9940,
    ra: "06h 45m 09s",
    dec: "-16° 42' 58\"",
  },
  {
    name: "Arcturus",
    desig: "α Boötis",
    x: 48,
    y: 13,
    dist: "37 ly",
    spec: "K1.5III",
    mag: "−0.05",
    teff: 4286,
    ra: "14h 15m 39s",
    dec: "+19° 10' 56\"",
  },
  {
    name: "Vega",
    desig: "α Lyrae",
    x: 82,
    y: 20,
    dist: "25 ly",
    spec: "A0V",
    mag: "0.03",
    teff: 9600,
    ra: "18h 36m 56s",
    dec: "+38° 47' 01\"",
  },
  {
    name: "Rigel",
    desig: "β Orionis",
    x: 14,
    y: 72,
    dist: "~860 ly",
    spec: "B8Ia",
    mag: "0.13",
    teff: 12100,
    ra: "05h 14m 32s",
    dec: "-08° 12' 06\"",
  },
  {
    name: "Betelgeuse",
    desig: "α Orionis",
    x: 85,
    y: 72,
    dist: "~550 ly",
    spec: "M1-2Ia",
    mag: "~0.5 (var.)",
    teff: 3600,
    ra: "05h 55m 10s",
    dec: "+07° 24' 25\"",
  },
  {
    name: "Proxima Centauri",
    desig: "α Centauri C",
    x: 66,
    y: 84,
    dist: "4.24 ly",
    spec: "M5.5Ve",
    mag: "11.13",
    teff: 3042,
    ra: "14h 29m 43s",
    dec: "-62° 40' 46\"",
  },
];

// Idle baseline viewport telemetry
const DEFAULT_TELEMETRY = {
  target: "VIEWPORT",
  ra: "12h 00m 00s",
  dec: "+00° 00' 00\"",
};

// Telemetry DOM nodes
const tTarget = document.getElementById("tTarget");
const tRA = document.getElementById("tRA");
const tDEC = document.getElementById("tDEC");

// Currently selected/locked star when info panel is open
let lockedStar = null;

// =============================================================================
// 3. LOW-SPEC MATRIX SCRAMBLING ENGINE (Acer 4GB RAM Target)
// =============================================================================

/**
 * Pre-allocated static glyph pools to eliminate garbage collection pauses.
 */
const NUM_CHARS = "0123456789";
const ALPHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function getScrambleGlyph(char) {
  if (char >= "0" && char <= "9") {
    return NUM_CHARS[(Math.random() * 10) | 0];
  }
  if (char === "+" || char === "-") {
    return Math.random() > 0.5 ? "+" : "-";
  }
  // Keep delimiter formatting readable during scramble
  if (char === "h" || char === "m" || char === "s" || char === "°" || char === "'" || char === '"' || char === " " || char === "/") {
    return char;
  }
  return ALPHA_CHARS[(Math.random() * ALPHA_CHARS.length) | 0];
}

/**
 * Optimized hacker-style scrambling text transition.
 * Uses requestAnimationFrame with immediate cancellation of previous frames to prevent
 * CPU bottlenecks and memory accumulation.
 */
function scrambleElement(el, targetText, duration = 260) {
  if (!el || el.textContent === targetText) return;

  // Cancel any currently running scramble on this specific element
  if (el._scrambleAnimId) {
    cancelAnimationFrame(el._scrambleAnimId);
    el._scrambleAnimId = null;
  }

  const targetLen = targetText.length;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    if (progress >= 1) {
      el.textContent = targetText;
      el._scrambleAnimId = null;
      return;
    }

    const lockedCount = Math.floor(progress * targetLen);
    let out = "";
    for (let i = 0; i < targetLen; i++) {
      if (i < lockedCount) {
        out += targetText[i];
      } else {
        out += getScrambleGlyph(targetText[i]);
      }
    }
    el.textContent = out;
    el._scrambleAnimId = requestAnimationFrame(step);
  }

  el._scrambleAnimId = requestAnimationFrame(step);
}

function applyTelemetry(target, ra, dec) {
  if (tTarget) scrambleElement(tTarget, target);
  if (tRA) scrambleElement(tRA, ra);
  if (tDEC) scrambleElement(tDEC, dec);
}

function updateTelemetryToStar(star) {
  applyTelemetry(star.name.toUpperCase(), star.ra, star.dec);
}

function revertTelemetry() {
  if (lockedStar) {
    updateTelemetryToStar(lockedStar);
  } else {
    applyTelemetry(DEFAULT_TELEMETRY.target, DEFAULT_TELEMETRY.ra, DEFAULT_TELEMETRY.dec);
  }
}

// =============================================================================
// 4. WEB AUDIO SYNTHESIZER (Stellar Sonification)
// =============================================================================

let audioCtx = null;
let soundOn = true;

function ensureAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function teffToFreq(teff) {
  const min = 2800;
  const max = 13000;
  const fMin = 180;
  const fMax = 760;
  const clamped = Math.max(min, Math.min(max, teff));
  return fMin + ((clamped - min) / (max - min)) * (fMax - fMin);
}

function playStarTone(teff) {
  if (!soundOn) return;
  const ctxA = ensureAudio();
  if (!ctxA) return;

  const now = ctxA.currentTime;
  const freq = teffToFreq(teff);
  const isHot = teff > 7000;

  const osc1 = ctxA.createOscillator();
  const osc2 = ctxA.createOscillator();
  const gain = ctxA.createGain();
  const filter = ctxA.createBiquadFilter();

  osc1.type = isHot ? "sine" : "triangle";
  osc2.type = isHot ? "square" : "sine";
  osc1.frequency.value = freq;
  osc2.frequency.value = freq * 2.01;
  filter.type = "lowpass";
  filter.frequency.value = isHot ? 6000 : 1800;

  const gain2 = ctxA.createGain();
  gain2.gain.value = isHot ? 0.06 : 0.02;

  osc1.connect(filter);
  osc2.connect(gain2).connect(filter);
  filter.connect(gain).connect(ctxA.destination);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.95);
  osc2.stop(now + 0.95);
}

function playHoverTick() {
  if (!soundOn) return;
  const ctxA = ensureAudio();
  if (!ctxA) return;

  const now = ctxA.currentTime;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.type = "sine";
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(gain).connect(ctxA.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

const soundToggle = document.getElementById("soundToggle");
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.dataset.on = String(soundOn);
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    const label = document.getElementById("soundLabel");
    if (label) label.textContent = "AUDIO: " + (soundOn ? "ON" : "OFF");
    if (soundOn) ensureAudio();
  });
}

// =============================================================================
// 5. FEATURED STAR MARKERS & INTERACTIVE HUD LAYER
// =============================================================================

const layer = document.getElementById("featuredLayer");
const panel = document.getElementById("infoPanel");

function openPanel(star, btn) {
  lockedStar = star;
  updateTelemetryToStar(star);

  document.getElementById("pName").textContent = star.name;
  document.getElementById("pDesig").textContent = star.desig;
  document.getElementById("pDist").textContent = star.dist;
  document.getElementById("pSpec").textContent = star.spec;
  document.getElementById("pMag").textContent = star.mag;
  document.getElementById("pTeff").textContent = star.teff.toLocaleString() + " K";

  const rect = btn.getBoundingClientRect();
  const panelW = 260;
  let left = rect.left + 24;
  let top = rect.top - 10;
  if (left + panelW > window.innerWidth - 20) left = rect.left - panelW - 24;
  if (top + 220 > window.innerHeight) top = window.innerHeight - 240;
  if (top < 20) top = 20;

  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.classList.add("open");
}

function closePanel() {
  if (panel) panel.classList.remove("open");
  lockedStar = null;
  revertTelemetry();
}

if (layer && panel) {
  FEATURED_STARS.forEach((star) => {
    const btn = document.createElement("button");
    btn.className = "featured-star";
    btn.style.left = star.x + "vw";
    btn.style.top = star.y + "vh";
    btn.setAttribute("aria-label", "Identify celestial target " + star.name);
    btn.innerHTML = `<span class="tag">${star.name.toUpperCase()}</span><span class="ring"></span><span class="core"></span>`;

    // Real-time hover preview with sound tick and coordinate scramble
    btn.addEventListener("mouseenter", () => {
      playHoverTick();
      updateTelemetryToStar(star);
    });

    // Revert to idle / locked coordinates on leave
    btn.addEventListener("mouseleave", () => {
      revertTelemetry();
    });

    // Click locks selection and opens telescope data popover
    btn.addEventListener("click", (e) => {
      playStarTone(star.teff);
      openPanel(star, btn);
      e.stopPropagation();
    });

    layer.appendChild(btn);
  });

  const infoClose = document.getElementById("infoClose");
  if (infoClose) {
    infoClose.addEventListener("click", closePanel);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  document.addEventListener("click", (e) => {
    if (panel.classList.contains("open") && !panel.contains(e.target) && !e.target.closest(".featured-star")) {
      closePanel();
    }
  });
}