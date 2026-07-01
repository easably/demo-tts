/**
 * Shared synthesis controls — same inference options on every demo tab.
 */

import { $ } from "./dom-utils.js";
import { labelWithInfo } from "./help-tooltips.js";
import {
  filteredVoices,
  isNarrationSafeVoice,
  refreshVoicePickers,
  voiceCatalog,
  voiceSelectOptions,
} from "./voice-catalog.js";
import { copyText, getConfig } from "./engine-config.js";

function defaultNarratorVoiceId() {
  return getConfig().defaults?.narratorVoiceId || "nora_neutral";
}

export function initSynthesisSettings() {
  renderSettingsPanel();
  bindSettingsActions();
  applyPresetDefaults();
}

function renderSettingsPanel() {
  const panel = $("synthesis-settings-panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="synthesis-settings-header">
      <h2>${labelWithInfo("Synthesis settings", "settings_overview")}</h2>
      <p class="hint synthesis-lead">
        dots.tts clones the speaker from a <strong>reference audio clip</strong> when one is provided.
        Use <strong>Zero-shot</strong> to generate speech without a reference (speaker style will vary).
        For book narration, pick a voice with a reference clip for consistent tone across paragraphs.
      </p>
    </div>
    <div class="synthesis-settings-grid">
      <label>${labelWithInfo("Voice list filter", "voice_filter")}
        <select id="syn-voice-filter">
          <option value="all">All presets</option>
          <option value="narrators" selected>Book narrators (neutral)</option>
          <option value="catalog">LibriTTS catalog only</option>
          <option value="expressive">Expressive (Mia / Leo)</option>
          <option value="with_ref">With reference clip</option>
          <option value="zero_shot">Zero-shot only</option>
        </select>
      </label>
      <label>${labelWithInfo("Default narrator", "default_narrator")}
        <select id="syn-default-narrator"></select>
      </label>
      <label>${labelWithInfo("Num steps", "num_steps")}
        <input id="syn-num-steps" type="number" step="1" min="4" max="32" value="10" />
      </label>
      <label>${labelWithInfo("Guidance scale", "guidance_scale")}
        <input id="syn-guidance-scale" type="number" step="0.1" min="0.5" max="5.0" value="1.2" />
      </label>
      <label>${labelWithInfo("Language", "language")}
        <select id="syn-language">
          <option value="auto_detect" selected>Auto-detect</option>
          <option value="EN">EN — English</option>
          <option value="ZH">ZH — Chinese</option>
          <option value="FR">FR — French</option>
          <option value="DE">DE — German</option>
          <option value="ES">ES — Spanish</option>
          <option value="IT">IT — Italian</option>
          <option value="JA">JA — Japanese</option>
          <option value="KO">KO — Korean</option>
          <option value="PT">PT — Portuguese</option>
          <option value="RU">RU — Russian</option>
          <option value="AR">AR — Arabic</option>
          <option value="TR">TR — Turkish</option>
        </select>
      </label>
      <label>${labelWithInfo("Seed (optional)", "seed")}
        <input id="syn-seed" type="number" step="1" min="0" placeholder="random" />
      </label>
      <label class="checkbox-label">${labelWithInfo("Normalize text", "normalize_text")}
        <input id="syn-normalize-text" type="checkbox" />
      </label>
    </div>
    <div class="synthesis-settings-actions">
      <button id="syn-unify-studio-lines" class="btn secondary" type="button">Unify dialogue lines to default narrator</button>
      <button id="syn-unify-book-lines" class="btn secondary" type="button">Unify book paragraphs to default narrator</button>
    </div>
  `;

  $("syn-default-narrator").innerHTML = voiceSelectOptions(defaultNarratorVoiceId(), narrationSafeVoices());
}

function narrationSafeVoices() {
  return voiceCatalog.voices.filter(isNarrationSafeVoice);
}

function bindSettingsActions() {
  $("syn-voice-filter")?.addEventListener("change", () => {
    refreshVoicePickers();
    const def = $("syn-default-narrator");
    if (def) def.innerHTML = voiceSelectOptions(def.value || defaultNarratorVoiceId(), filteredVoices());
  });

  $("syn-unify-studio-lines")?.addEventListener("click", () => {
    unifyContainerVoices("dialogue-lines");
    document.getElementById("dialogue-lines")?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  $("syn-unify-book-lines")?.addEventListener("click", () => {
    unifyContainerVoices("book-lines");
  });
}

function unifyContainerVoices(containerId) {
  const voiceId = $("syn-default-narrator")?.value || defaultNarratorVoiceId();
  const container = $(containerId);
  if (!container) return;
  container.querySelectorAll(".voice").forEach((select) => {
    select.value = voiceId;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function applyPresetDefaults() {
  const defaults = voiceCatalog.defaultOptions;
  if (!defaults) return;
  if (defaults.num_steps != null) $("syn-num-steps").value = defaults.num_steps;
  if (defaults.guidance_scale != null) $("syn-guidance-scale").value = defaults.guidance_scale;
  if (defaults.language != null) $("syn-language").value = defaults.language;
  if (defaults.seed != null) $("syn-seed").value = defaults.seed;
  if (defaults.normalize_text != null) $("syn-normalize-text").checked = Boolean(defaults.normalize_text);
}

export function readSynthesisOptions() {
  const seedVal = $("syn-seed").value;
  return {
    num_steps: Number($("syn-num-steps").value),
    guidance_scale: Number($("syn-guidance-scale").value),
    language: $("syn-language").value,
    seed: seedVal ? Number(seedVal) : null,
    normalize_text: $("syn-normalize-text").checked,
  };
}

export function unifyBookParagraphs() {
  unifyContainerVoices("book-lines");
  document.dispatchEvent(new CustomEvent("book-lines-changed"));
}

export function getDefaultNarratorId() {
  return $("syn-default-narrator")?.value || defaultNarratorVoiceId();
}

export function refreshTuningSummary() {
  /* dots: no profile summary bar */
}

export function switchToTuningTab() {
  document.querySelector('.tab[data-tab="tuning"]')?.click();
}

export function formatVoiceHint(voice) {
  if (!voice) return "";
  const parts = [];
  if (voice.character_label) parts.push(`Character: ${voice.character_label}`);
  if (voice.intonation) parts.push(`intonation: ${voice.intonation}`);
  const desc = voice.hint || voice.description || "";
  if (desc) parts.push(desc);
  return parts.join(" · ");
}
