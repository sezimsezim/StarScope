/**
 * STARSCOPE — Main Landing Interface & Telemetry Controller
 * NASA Hackathon Edition // Low-Spec Hardware Optimized
 */

import { decToDms, loadGaiaStars, raToHms } from "../gaia-adapter.js";

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

const FEATURED_POSITIONS = [
  { x: 15, y: 22 },
  { x: 48, y: 13 },
  { x: 82, y: 20 },
  { x: 14, y: 72 },
  { x: 85, y: 72 },
  { x: 66, y: 84 },
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
  const ra = Number.isFinite(star.ra) ? raToHms(star.ra) : "—";
  const dec = Number.isFinite(star.dec) ? decToDms(star.dec) : "—";
  applyTelemetry(star.name.toUpperCase(), ra, dec);
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
let ambientBus = null;
let ambientOscillators = [];
let ambientFilter = null;
let ambientStopTimer = null;
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

function startAmbient() {
  if (!soundOn) return;
  const ctxA = ensureAudio();
  if (!ctxA) return;

  window.clearTimeout(ambientStopTimer);
  ambientStopTimer = null;

  if (!ambientBus) {
    ambientFilter = ctxA.createBiquadFilter();
    ambientBus = ctxA.createGain();
    ambientFilter.type = "lowpass";
    ambientFilter.frequency.value = 700;
    ambientFilter.Q.value = 0.4;
    ambientBus.gain.value = 0.0001;
    ambientFilter.connect(ambientBus).connect(ctxA.destination);

    [[98, 0.2], [146.83, 0.12], [196, 0.06]].forEach(([frequency, level]) => {
      const oscillator = ctxA.createOscillator();
      const voice = ctxA.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      voice.gain.value = level;
      oscillator.connect(voice).connect(ambientFilter);
      oscillator.start();
      ambientOscillators.push(oscillator);
    });
  }

  const now = ctxA.currentTime;
  ambientBus.gain.cancelScheduledValues(now);
  ambientBus.gain.setTargetAtTime(0.012, now, 2);
}

function stopAmbient() {
  if (!audioCtx || !ambientBus) return;
  const now = audioCtx.currentTime;
  const busToStop = ambientBus;
  ambientBus.gain.cancelScheduledValues(now);
  ambientBus.gain.setTargetAtTime(0.0001, now, 0.35);
  window.clearTimeout(ambientStopTimer);
  ambientStopTimer = window.setTimeout(() => {
    if (soundOn || ambientBus !== busToStop) return;
    ambientOscillators.forEach((oscillator) => oscillator.stop());
    ambientOscillators = [];
    ambientFilter?.disconnect();
    ambientBus?.disconnect();
    ambientFilter = null;
    ambientBus = null;
    ambientStopTimer = null;
  }, 1200);
}

function teffToFreq(teff) {
  const min = 2800;
  const max = 13000;
  const clamped = Math.max(min, Math.min(max, teff));
  const scale = [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33, 659.25];
  const noteIndex = Math.round(((clamped - min) / (max - min)) * (scale.length - 1));
  return scale[noteIndex];
}

function playStarTone(teff) {
  if (!soundOn || !Number.isFinite(teff)) return;
  startAmbient();
  const ctxA = ensureAudio();
  if (!ctxA) return;

  const now = ctxA.currentTime;
  const freq = teffToFreq(teff);
  const oscillator = ctxA.createOscillator();
  const gain = ctxA.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  oscillator.connect(gain).connect(ctxA.destination);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.035, now + 0.24);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

  oscillator.start(now);
  oscillator.stop(now + 2.45);
  oscillator.onended = () => {
    gain.disconnect();
  };
}

function playHoverTick() {
  if (!soundOn) return;
  const ctxA = ensureAudio();
  if (!ctxA) return;

  const now = ctxA.currentTime;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.type = "sine";
  osc.frequency.value = 523.25;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.006, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  osc.connect(gain).connect(ctxA.destination);
  osc.start(now);
  osc.stop(now + 0.48);
}

const soundToggle = document.getElementById("soundToggle");
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.dataset.on = String(soundOn);
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    const label = document.getElementById("soundLabel");
    if (label) label.textContent = "AUDIO: " + (soundOn ? "ON" : "OFF");
    if (soundOn) startAmbient();
    else stopAmbient();
  });
}

document.addEventListener("pointerdown", (event) => {
  if (soundOn && !event.target.closest("#soundToggle")) startAmbient();
}, { once: true });

// =============================================================================
// 5. FEATURED STAR MARKERS & INTERACTIVE HUD LAYER
// =============================================================================

const layer = document.getElementById("featuredLayer");
const panel = document.getElementById("infoPanel");

const PANEL_MARGIN = 16;
const PANEL_MAX_WIDTH = 260;
let activeStarButton = null;

function positionPanel(button) {
  if (!button || !panel || !panel.classList.contains("open")) return;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const starRect = button.getBoundingClientRect();
  const panelWidth = Math.min(PANEL_MAX_WIDTH, viewportWidth - PANEL_MARGIN * 2);
  panel.style.width = `${panelWidth}px`;

  const panelHeight = panel.offsetHeight;
  let left;
  let top;

  if (viewportWidth <= 640) {
    left = starRect.left + starRect.width / 2 - panelWidth / 2;
    top = starRect.bottom + 30;
    if (top + panelHeight > viewportHeight - PANEL_MARGIN) {
      top = starRect.top - panelHeight - 16;
    }
  } else {
    left = starRect.right + 24;
    if (left + panelWidth > viewportWidth - PANEL_MARGIN) {
      left = starRect.left - panelWidth - 24;
    }
    top = starRect.top - 10;
  }

  left = Math.max(PANEL_MARGIN, Math.min(left, viewportWidth - panelWidth - PANEL_MARGIN));
  top = Math.max(PANEL_MARGIN, Math.min(top, viewportHeight - panelHeight - PANEL_MARGIN));
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function openPanel(star, btn) {
  lockedStar = star;
  activeStarButton = btn;
  updateTelemetryToStar(star);

  document.getElementById("pName").textContent = star.name;
  document.getElementById("pDesig").textContent = star.designation;
  document.getElementById("pDist").textContent = star.dist;
  document.getElementById("pParallax").textContent = star.parallaxDisplay;
  document.getElementById("pMag").textContent = star.gmag;
  document.getElementById("pTeff").textContent = star.temp;

  panel.classList.add("open");
  positionPanel(btn);
}

function closePanel() {
  if (panel) panel.classList.remove("open");
  lockedStar = null;
  activeStarButton = null;
  revertTelemetry();
}

window.addEventListener("resize", () => positionPanel(activeStarButton), { passive: true });

function renderFeaturedStars(stars) {
  const featuredStars = stars
    .filter((star) => star.selection === "nearest")
    .slice(0, FEATURED_POSITIONS.length);

  featuredStars.forEach((star, index) => {
    const position = FEATURED_POSITIONS[index];
    const btn = document.createElement("button");
    btn.className = "featured-star";
    btn.style.left = position.x + "vw";
    btn.style.top = position.y + "vh";
    btn.setAttribute("aria-label", "Identify celestial target " + star.name);
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = star.name.toUpperCase();
    const ring = document.createElement("span");
    ring.className = "ring";
    const core = document.createElement("span");
    core.className = "core";
    btn.append(tag, ring, core);

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
      playStarTone(star.temperature);
      openPanel(star, btn);
      e.stopPropagation();
    });

    layer.appendChild(btn);
  });
}

if (layer && panel) {
  loadGaiaStars("./data/gaia-stars.json")
    .then((stars) => {
      renderFeaturedStars(stars);
      const sampleCount = document.getElementById("catalogSampleCount");
      if (sampleCount) sampleCount.textContent = `GAIA DR3 // ${stars.length} CATALOG SOURCES`;
    })
    .catch((error) => {
      console.error("Failed to load Gaia DR3 catalog on landing page:", error);
      const sampleCount = document.getElementById("catalogSampleCount");
      if (sampleCount) sampleCount.textContent = "GAIA DR3 // SAMPLE UNAVAILABLE";
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