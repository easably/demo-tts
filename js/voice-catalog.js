/** Voice catalog facade — dispatches to TADA or dots.tts implementation. */

import { apiProfile, getConfig } from "./engine-config.js";
import { voiceCatalog } from "./voice-catalog-state.js";
import * as tada from "./voice-catalog-tada.js";
import * as dots from "./voice-catalog-dots.js";

export { voiceCatalog };

function impl() {
  return apiProfile() === "dots" ? dots : tada;
}

export const isBookSafeVoice = (...args) => impl().isBookSafeVoice?.(...args);
export const isNarrationSafeVoice = (...args) => impl().isNarrationSafeVoice?.(...args);
export const recordingQualityLabel = (...args) => impl().recordingQualityLabel?.(...args);
export const voiceModeLabel = (...args) => impl().voiceModeLabel?.(...args);
export const filteredVoices = (...args) => impl().filteredVoices(...args);
export const voiceSelectOptions = (...args) => impl().voiceSelectOptions(...args);
export const findVoice = (...args) => impl().findVoice(...args);
export const refreshVoicePickers = (...args) => impl().refreshVoicePickers(...args);
export const bindVoicePreview = (...args) => impl().bindVoicePreview(...args);
