/**
 * Per-engine overlay: /demo/config.json (mounted by each TTS server).
 * Shared UI code stays engine-neutral; branding and copy live in config.
 */

let _config = null;

const FALLBACK = {
  schema: "tts-demo-config/1",
  engine: "tts",
  apiBase: "",
  branding: {
    title: "Speech synthesis demo",
    pageTitle: "TTS Demo",
    eyebrow: "GPU inference",
    engineName: "TTS",
    subtitleHtml: "Voice preset picks intonation from a reference clip.",
    logsPageTitle: "TTS — Ops Log",
    logsEyebrow: "GPU monitoring",
  },
  copy: {},
  tooltips: {},
  features: { studio: true, book: true, tuning: true, opsLog: true },
  defaults: { characterOrder: ["Other"] },
  storageKeyPrefix: "tts",
};

export async function loadEngineConfig() {
  try {
    const res = await fetch("/demo/config.json", { cache: "no-store" });
    if (res.ok) {
      _config = { ...FALLBACK, ...(await res.json()) };
      _config.branding = { ...FALLBACK.branding, ...(_config.branding || {}) };
      _config.features = { ...FALLBACK.features, ...(_config.features || {}) };
      _config.defaults = { ...FALLBACK.defaults, ...(_config.defaults || {}) };
    } else {
      console.warn("No /demo/config.json — using generic demo defaults");
      _config = { ...FALLBACK };
    }
  } catch (err) {
    console.warn("Failed to load config.json", err);
    _config = { ...FALLBACK };
  }
  applyBranding();
  return _config;
}

export function getConfig() {
  return _config || FALLBACK;
}

export function apiProfile() {
  const cfg = getConfig();
  if (cfg.apiProfile) return cfg.apiProfile;
  return cfg.engine === "dots" ? "dots" : "tada";
}

export function engineName() {
  return getConfig().branding?.engineName || "TTS";
}

export function apiBase() {
  const base = getConfig().apiBase || "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function storageKey(suffix) {
  return `${getConfig().storageKeyPrefix || "tts"}-${suffix}`;
}

export function tooltipText(key, fallback = "") {
  const raw = getConfig().tooltips?.[key] ?? fallback;
  return String(raw).replace(/\{\{engine\}\}/g, engineName());
}

export function copyText(key, fallback = "") {
  return getConfig().copy?.[key] ?? fallback;
}

function applyBranding() {
  const b = getConfig().branding;
  if (!b) return;

  document.title = b.pageTitle || b.title;
  const eyebrow = document.querySelector("[data-brand-eyebrow]");
  if (eyebrow) eyebrow.textContent = b.eyebrow;
  const title = document.querySelector("[data-brand-title]");
  if (title) title.textContent = b.title;
  const subtitle = document.querySelector("[data-brand-subtitle]");
  if (subtitle && b.subtitleHtml) subtitle.innerHTML = b.subtitleHtml;

  const logsTitle = document.querySelector("[data-brand-logs-title]");
  if (logsTitle) logsTitle.textContent = b.logsPageTitle || b.pageTitle;
  const logsEyebrow = document.querySelector("[data-brand-logs-eyebrow]");
  if (logsEyebrow) logsEyebrow.textContent = b.logsEyebrow || b.eyebrow;

  const features = getConfig().features || {};
  document.querySelectorAll("[data-feature]").forEach((el) => {
    const on = features[el.dataset.feature] !== false;
    el.classList.toggle("hidden", !on);
    if (el.tagName === "BUTTON" && !on) el.disabled = true;
  });
}
