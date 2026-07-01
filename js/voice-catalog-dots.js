/** Voice presets — dots.tts filters and labels. */

import { voiceCatalog } from "./voice-catalog-state.js";

export { voiceCatalog };

export function isNarrationSafeVoice(voice) {
  return Boolean(voice?.narration_recommended);
}

export function voiceModeLabel(voice) {
  if (!voice) return "";
  if (voice.language && voice.cloning_mode !== "no_reference") {
    return voice.language;
  }
  if (voice.cloning_mode === "no_reference") return "zero-shot";
  return voice.cloning_mode || "";
}

export function filteredVoices() {
  const filter = document.getElementById("syn-voice-filter")?.value || "all";
  if (filter === "with_ref") {
    return voiceCatalog.voices.filter((v) => v.sample != null);
  }
  if (filter === "zero_shot") {
    return voiceCatalog.voices.filter((v) => v.sample == null);
  }
  if (filter === "narrators") {
    return voiceCatalog.voices.filter(
      (v) => v.cast_role === "narrator" || v.narration_recommended
    );
  }
  if (filter === "catalog") {
    return voiceCatalog.voices.filter((v) => v.catalog);
  }
  if (filter === "expressive") {
    return voiceCatalog.voices.filter((v) => v.cast_role === "expressive");
  }
  return voiceCatalog.voices;
}

export function voiceSelectOptions(selectedId = "mia_neutral", voices = null) {
  const list = voices || filteredVoices();
  const groups = new Map();

  for (const voice of list) {
    const key = voice.character_label || voice.character || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(voice);
  }

  const order = ["Nora", "Owen", "LJ", "Jill", "Sharon", "Jennifer", "Stephen", "David", "Mia", "Leo", "Other"];
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

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function optionHtml(voice, selectedId) {
  const modeTag = voiceModeLabel(voice);
  const suffix = modeTag ? ` · ${modeTag}` : "";
  const missing = voice.sample_available === false ? " · sample missing" : "";
  return `<option value="${voice.id}" ${voice.id === selectedId ? "selected" : ""}>${voice.label}${suffix}${missing}</option>`;
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
      single.value = "zero_shot";
    }
    single.dispatchEvent(new Event("change"));
  }

  document.querySelectorAll(".line-row .voice").forEach((select) => {
    const current = select.value;
    select.innerHTML = voiceSelectOptions(current);
    if (![...select.options].some((o) => o.value === current)) {
      select.value = "zero_shot";
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
    const modeTag = voiceModeLabel(voice);
    let desc = voice.hint || voice.description || "";
    if (modeTag) desc = `[${modeTag}] ${desc}`;
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
