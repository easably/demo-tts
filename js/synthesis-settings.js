/** Synthesis settings facade — TADA vs dots.tts controls. */

import { apiProfile } from "./engine-config.js";
import * as tada from "./synthesis-settings-tada.js";
import * as dots from "./synthesis-settings-dots.js";

function impl() {
  return apiProfile() === "dots" ? dots : tada;
}

export function initSynthesisSettings() {
  return impl().initSynthesisSettings();
}

export function readSynthesisOptions() {
  return impl().readSynthesisOptions();
}

export function unifyBookParagraphs() {
  return impl().unifyBookParagraphs?.() ?? impl().unifyContainerVoices?.("book-lines");
}

export function refreshTuningSummary() {
  return impl().refreshTuningSummary?.();
}

export function switchToTuningTab() {
  return impl().switchToTuningTab?.();
}

export function getDefaultNarratorId() {
  return impl().getDefaultNarratorId();
}

export function formatVoiceHint(voice) {
  if (impl().formatVoiceHint) return impl().formatVoiceHint(voice);
  return voice?.hint || voice?.description || "";
}
