/** Voice presets — TADA filters and labels. */

import { getConfig } from "./engine-config.js";
import { voiceCatalog } from "./voice-catalog-state.js";

export { voiceCatalog };

export function isBookSafeVoice(voice) {
  if (voice?.free_license === true) return true;
  return Boolean(voice?.narration_recommended);
}

export function recordingQualityLabel(voice) {
  if (!voice?.recording_quality) return "";
  const map = {
    studio_clean: "clean studio",
    dramatic: "dramatic",
    legacy: "legacy recording",
    generic: "no reference",
  };
  return map[voice.recording_quality] || voice.recording_quality;
}

export function filteredVoices() {
  const filter = document.getElementById("syn-voice-filter")?.value || "all";
  if (filter === "clean") {
    return voiceCatalog.voices.filter(isBookSafeVoice);
  }
  if (filter === "legacy") {
    return voiceCatalog.voices.filter(
      (v) => v.recording_quality === "legacy" || v.recording_quality === "dramatic"
    );
  }
  return voiceCatalog.voices;
}

export function voiceSelectOptions(selectedId = "nova_neutral", voices = null) {
  const list = voices || filteredVoices();
  const groups = new Map();

  for (const voice of list) {
    const key = voice.character_label || voice.character || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(voice);
  }

  const order = getConfig().defaults?.characterOrder || ["Other"];
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  if (sortedKeys.length <= 1 && list.length <= 12) {
    return list
      .map((voice) => optionHtml(voice, selectedId))
      .join("");
  }

  return sortedKeys
    .map((group) => {
      const opts = groups
        .get(group)
        .map((voice) => optionHtml(voice, selectedId))
        .join("");
      return `<optgroup label="${escapeAttr(group)}">${opts}</optgroup>`;
    })
    .join("");
}

function optionHtml(voice, selectedId) {
  const quality = recordingQualityLabel(voice);
  const suffix = quality ? ` · ${quality}` : "";
  const missing = voice.sample_available === false ? " · sample missing" : "";
  return `<option value="${voice.id}" ${voice.id === selectedId ? "selected" : ""}>${voice.label}${suffix}${missing}</option>`;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function findVoice(voiceId) {
  return voiceCatalog.voices.find((voice) => voice.id === voiceId);
}

export function refreshVoicePickers() {
  const single = document.getElementById("single-voice");
  if (single) {
    const current = single.value;
    single.innerHTML = voiceSelectOptions(current);
    if (![...single.options].some((o) => o.value === current)) {
      single.value = "nova_neutral";
    }
    single.dispatchEvent(new Event("change"));
  }

  document.querySelectorAll(".line-row .voice").forEach((select) => {
    const current = select.value;
    select.innerHTML = voiceSelectOptions(current);
    if (![...select.options].some((o) => o.value === current)) {
      select.value = "nova_neutral";
    }
    select.dispatchEvent(new Event("change"));
  });
}

export function bindVoicePreview(selectId, descriptionId, previewAudioId) {
  const select = document.getElementById(selectId);
  const description = document.getElementById(descriptionId);
  const preview = document.getElementById(previewAudioId);
  if (!select || !description || !preview) return;

  const refresh = () => {
    const voice = findVoice(select.value);
    if (!voice) return;
    const quality = recordingQualityLabel(voice);
    let desc = voice.hint || voice.description || "";
    if (quality) desc = `[${quality}] ${desc}`;
    if (voice.quality_note) desc = desc ? `${desc} ${voice.quality_note}` : voice.quality_note;
    description.textContent = desc;
    if (voice.preview_url && voice.sample_available) {
      preview.src = voice.preview_url;
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
      preview.removeAttribute("src");
    }
  };

  select.addEventListener("change", refresh);
  refresh();
}
