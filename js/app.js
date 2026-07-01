/** Demo page bootstrap. */

import { apiRequest } from "./api-client.js";
import { showBanner } from "./dom-utils.js";
import { copyText, engineName, loadEngineConfig } from "./engine-config.js";
import { voiceCatalog } from "./voice-catalog.js";
import { initSynthesisSettings } from "./synthesis-settings.js";
import { initSpeechStudio } from "./speech-studio.js";
import { initBookNarration } from "./book-narration.js";

function bindMainTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

function applyStaticCopy() {
  document.querySelectorAll("[data-copy]").forEach((el) => {
    const text = copyText(el.dataset.copy);
    if (text) el.textContent = text;
  });
  document.querySelectorAll("[data-copy-html]").forEach((el) => {
    const html = copyText(el.dataset.copyHtml);
    if (html) el.innerHTML = html;
  });
}

async function loadVoicePresets() {
  const presets = await apiRequest("/api/presets");
  voiceCatalog.voices = presets.voices;
  voiceCatalog.dialogueExamples = presets.dialogue_examples;
  voiceCatalog.bookExamples = presets.book_examples;
  voiceCatalog.defaultOptions = presets.default_options;

  if (presets.engine_error) {
    showBanner(`${engineName()} engine error: ${presets.engine_error}`, "error");
  }
}

async function initDemoPage() {
  await loadEngineConfig();
  applyStaticCopy();
  bindMainTabs();
  await loadVoicePresets();
  initSynthesisSettings();
  initSpeechStudio();
  initBookNarration();
}

initDemoPage().catch((err) => {
  console.error(err);
  showBanner(`Failed to load voice presets: ${err.message}`, "error");
});
