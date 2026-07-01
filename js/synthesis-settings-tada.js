/**
 * Shared synthesis controls — Voice tuning tab + summary on studio/book.
 */

import { $ } from "./dom-utils.js";
import { labelWithInfo } from "./help-tooltips.js";
import {
  filteredVoices,
  findVoice,
  refreshVoicePickers,
  voiceCatalog,
  voiceSelectOptions,
} from "./voice-catalog.js";

import { getConfig, storageKey, tooltipText, copyText } from "./engine-config.js";

export const TUNING_PROFILES = {
  default: {
    label: "Default",
    descriptionKey: "defaultProfileNote",
    descriptionFallback: "Balanced — recommended defaults.",
    acoustic_cfg_scale: 1.6,
    duration_cfg_scale: 1.0,
    num_flow_matching_steps: 10,
    noise_temperature: 0.9,
    speed_up_factor: 0,
    normalize_text: true,
  },
  stable_book: {
    label: "Stable book",
    description: "One narrator, minimal drift — lower randomness, stronger reference lock.",
    acoustic_cfg_scale: 1.9,
    duration_cfg_scale: 1.0,
    num_flow_matching_steps: 12,
    noise_temperature: 0.7,
    speed_up_factor: 0,
    normalize_text: true,
  },
  expressive: {
    label: "Expressive",
    description: "More intonation variation — good for dialogue, less for audiobooks.",
    acoustic_cfg_scale: 1.5,
    duration_cfg_scale: 1.0,
    num_flow_matching_steps: 10,
    noise_temperature: 0.95,
    speed_up_factor: 0,
    normalize_text: true,
  },
};

let activeProfileId = "default";

function defaultNarratorVoiceId() {
  return getConfig().defaults?.narratorVoiceId || "nova_neutral";
}

function tuningStorageKey() {
  return storageKey("tuning-profile");
}

function profileDescription(profile) {
  if (profile.descriptionKey) {
    return copyText(profile.descriptionKey, profile.descriptionFallback || "");
  }
  return profile.description || "";
}

export function initSynthesisSettings() {
  renderSettingsPanel();
  bindSettingsActions();
  applyPresetDefaults();
  loadSavedProfile();
  mountSummaryBars();
  refreshTuningSummary();
}

function renderSettingsPanel() {
  const panel = $("synthesis-settings-panel");
  if (!panel) return;

  const profileButtons = Object.entries(TUNING_PROFILES)
    .map(
      ([id, p]) =>
        `<button type="button" class="tuning-profile-btn" data-profile="${id}">${p.label}</button>`
    )
    .join("");

  panel.innerHTML = `
    <div class="synthesis-settings-header">
      <h2>${labelWithInfo("Voice & generation tuning", "settings_overview")}</h2>
      <p class="hint synthesis-lead">${tooltipText(
        "tuning_lead",
        "<strong>Voice preset</strong> = reference WAV (character + intonation). Use <strong>Stable book</strong> + one preset on all paragraphs for a uniform narrator."
      )}</p>
    </div>

    <section class="tuning-section">
      <h3>${labelWithInfo("Quick profiles", "tuning_profiles")}</h3>
      <div class="tuning-profile-buttons" role="group" aria-label="Tuning profiles">
        ${profileButtons}
      </div>
      <p id="tuning-profile-desc" class="hint tuning-profile-desc"></p>
    </section>

    <section class="tuning-section">
      <h3>${labelWithInfo("Voice catalog", "voice_catalog_section")}</h3>
      <div class="synthesis-settings-grid synthesis-settings-grid--catalog">
        <label>${labelWithInfo("Voice list filter", "voice_filter")}
          <select id="syn-voice-filter">
            <option value="all">All presets</option>
            <option value="clean" selected>Book-safe (clean studio)</option>
            <option value="legacy">Legacy / dramatic only</option>
          </select>
        </label>
        <label>${labelWithInfo("Default narrator", "default_narrator")}
          <select id="syn-default-narrator"></select>
        </label>
      </div>
      <div class="synthesis-settings-actions">
        <button id="syn-unify-studio-lines" class="btn secondary" type="button">Unify dialogue lines</button>
        <button id="syn-unify-book-lines" class="btn secondary" type="button">Unify book paragraphs</button>
      </div>
    </section>

    <section class="tuning-section">
      <h3>${labelWithInfo("Generation parameters", "generation_params")}</h3>
      <div class="synthesis-settings-grid">
        <label>${labelWithInfo("Acoustic CFG", "acoustic_cfg")}
          <input id="syn-acoustic-cfg" type="number" step="0.1" min="1" max="3" value="1.6" />
        </label>
        <label>${labelWithInfo("Duration CFG", "duration_cfg")}
          <input id="syn-duration-cfg" type="number" step="0.1" min="1" max="3" value="1.0" />
        </label>
        <label>${labelWithInfo("Flow steps", "flow_steps")}
          <input id="syn-flow-steps" type="number" step="1" min="5" max="50" value="10" />
        </label>
        <label>${labelWithInfo("Noise temperature", "noise_temperature")}
          <input id="syn-noise-temperature" type="number" step="0.05" min="0.5" max="1.2" value="0.9" />
        </label>
        <label>${labelWithInfo("Speed-up", "speed_up")}
          <input id="syn-speed-up" type="number" step="0.1" min="0" max="3" value="0" />
        </label>
        <label class="checkbox-label">${labelWithInfo("Normalize text", "normalize_text")}
          <input id="syn-normalize-text" type="checkbox" checked />
        </label>
      </div>
      <p class="hint">
        Sliders apply to every <strong>Generate</strong> on Speech studio and Book narration.
        Lower <em>noise temperature</em> → more similar results when you re-run the same line.
      </p>
    </section>
  `;

  $("syn-default-narrator").innerHTML = voiceSelectOptions(defaultNarratorVoiceId(), bookSafeVoices());
  updateProfileButtons();
  updateProfileDescription();
}

function bookSafeVoices() {
  return voiceCatalog.voices.filter((v) => v.narration_recommended);
}

function bindSettingsActions() {
  document.querySelectorAll(".tuning-profile-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyTuningProfile(btn.dataset.profile));
  });

  $("syn-voice-filter")?.addEventListener("change", () => {
    refreshVoicePickers();
    const def = $("syn-default-narrator");
    if (def) def.innerHTML = voiceSelectOptions(def.value || defaultNarratorVoiceId(), filteredVoices());
  });

  ["syn-acoustic-cfg", "syn-duration-cfg", "syn-flow-steps", "syn-noise-temperature", "syn-speed-up", "syn-normalize-text"].forEach(
    (id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("change", () => {
        activeProfileId = "custom";
        updateProfileButtons();
        updateProfileDescription();
        saveCustomSettings();
        refreshTuningSummary();
      });
      if (el.type === "number") {
        el.addEventListener("input", () => refreshTuningSummary());
      }
    }
  );

  $("syn-unify-studio-lines")?.addEventListener("click", () => {
    unifyContainerVoices("dialogue-lines");
    document.getElementById("dialogue-lines")?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  $("syn-unify-book-lines")?.addEventListener("click", () => {
    unifyBookParagraphs();
  });
}

export function unifyBookParagraphs() {
  unifyContainerVoices("book-lines");
  document.dispatchEvent(new CustomEvent("book-lines-changed"));
}

export function applyTuningProfile(profileId) {
  const profile = TUNING_PROFILES[profileId];
  if (!profile) return;
  activeProfileId = profileId;
  $("syn-acoustic-cfg").value = profile.acoustic_cfg_scale;
  $("syn-duration-cfg").value = profile.duration_cfg_scale;
  $("syn-flow-steps").value = profile.num_flow_matching_steps;
  $("syn-noise-temperature").value = profile.noise_temperature;
  $("syn-speed-up").value = profile.speed_up_factor;
  $("syn-normalize-text").checked = profile.normalize_text;
  updateProfileButtons();
  updateProfileDescription();
  try {
    localStorage.setItem(tuningStorageKey(), profileId);
  } catch {
    /* ignore */
  }
  refreshTuningSummary();
}

function loadSavedProfile() {
  try {
    const saved = localStorage.getItem(tuningStorageKey());
    if (saved && TUNING_PROFILES[saved]) {
      applyTuningProfile(saved);
      return;
    }
  } catch {
    /* ignore */
  }
  applyTuningProfile("stable_book");
}

function saveCustomSettings() {
  try {
    localStorage.setItem(tuningStorageKey(), "custom");
  } catch {
    /* ignore */
  }
}

function updateProfileButtons() {
  document.querySelectorAll(".tuning-profile-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.profile === activeProfileId);
  });
}

function updateProfileDescription() {
  const el = $("tuning-profile-desc");
  if (!el) return;
  if (activeProfileId === "custom") {
    el.textContent = "Custom — you changed sliders manually.";
    return;
  }
  el.textContent = profileDescription(TUNING_PROFILES[activeProfileId] || {});
}

function unifyContainerVoices(containerId) {
  const voiceId = $("syn-default-narrator")?.value || defaultNarratorVoiceId();
  const container = $(containerId);
  if (!container) return;
  container.querySelectorAll(".voice").forEach((select) => {
    select.value = voiceId;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  if (containerId === "book-lines") {
    document.dispatchEvent(new CustomEvent("book-lines-changed"));
  }
}

function applyPresetDefaults() {
  const defaults = voiceCatalog.defaultOptions;
  if (!defaults) return;
  if (defaults.acoustic_cfg_scale != null && !localStorage.getItem(tuningStorageKey())) {
    $("syn-acoustic-cfg").value = defaults.acoustic_cfg_scale;
  }
}

export function readSynthesisOptions() {
  return {
    acoustic_cfg_scale: Number($("syn-acoustic-cfg").value),
    duration_cfg_scale: Number($("syn-duration-cfg").value),
    num_flow_matching_steps: Number($("syn-flow-steps").value),
    noise_temperature: Number($("syn-noise-temperature").value),
    speed_up_factor: Number($("syn-speed-up").value),
    normalize_text: $("syn-normalize-text").checked,
  };
}

function mountSummaryBars() {
  ["studio-tuning-summary", "book-tuning-summary"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = `
      <div class="tuning-summary-inner">
        <span class="tuning-summary-text"></span>
        <button type="button" class="btn linkish tuning-summary-edit">Open Voice tuning</button>
      </div>
    `;
    el.querySelector(".tuning-summary-edit")?.addEventListener("click", () => {
      switchToTuningTab();
    });
  });
}

export function refreshTuningSummary() {
  const opts = readSynthesisOptions();
  const profileName =
    activeProfileId === "custom"
      ? "Custom"
      : TUNING_PROFILES[activeProfileId]?.label || "Default";
  const text = `Profile: ${profileName} · Noise ${opts.noise_temperature} · Acoustic CFG ${opts.acoustic_cfg_scale} · Flow ${opts.num_flow_matching_steps}`;
  document.querySelectorAll(".tuning-summary-text").forEach((el) => {
    el.textContent = text;
  });
}

export function switchToTuningTab() {
  const tab = document.querySelector('.tab[data-tab="tuning"]');
  tab?.click();
  $("synthesis-settings-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function getDefaultNarratorId() {
  return $("syn-default-narrator")?.value || defaultNarratorVoiceId();
}

export function formatVoiceHint(voice) {
  if (!voice) return "";
  const parts = [];
  if (voice.character_label) parts.push(`Character: ${voice.character_label}`);
  if (voice.intonation) parts.push(`intonation: ${voice.intonation}`);
  const desc = voice.hint || voice.description || "";
  if (desc) parts.push(desc);
  if (voice.quality_note) parts.push(voice.quality_note);
  return parts.join(" · ");
}
