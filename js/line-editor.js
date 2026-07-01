/** Reusable multi-line script editor (dialogue + book). */

import { voiceSelectOptions, findVoice } from "./voice-catalog.js";
import { labelWithInfo } from "./help-tooltips.js";
import { formatVoiceHint } from "./synthesis-settings.js";
import { copyText, getConfig } from "./engine-config.js";

export function createScriptLineRow(kind, data = {}) {
  const row = document.createElement("div");
  row.className = "line-row";
  const nameLabel =
    kind === "dialogue"
      ? labelWithInfo("Script name", "script_name")
      : labelWithInfo("Paragraph label", "book_paragraph");
  const speakerDefault = data.speaker || (kind === "dialogue" ? "Character" : "Paragraph");
  const voiceId = data.voice_id || getConfig().defaults?.narratorVoiceId || "nova_neutral";
  const speakerPlaceholder = copyText("speakerPlaceholder", "Speaker");
  const voice = findVoice(voiceId);

  row.innerHTML = `
    <div class="line-row-text">
      <label>${labelWithInfo("Spoken text", "spoken_text")}</label>
      <textarea class="text" rows="2" placeholder="What this line should say…">${escapeHtml(data.text || "")}</textarea>
    </div>
    <div class="line-row-meta">
      <div class="line-row-field line-row-speaker">
        <label>${nameLabel}</label>
        <input type="text" class="speaker" value="${escapeAttr(speakerDefault)}" placeholder="${escapeAttr(speakerPlaceholder)}" />
      </div>
      <div class="line-row-field line-row-voice">
        <label>${labelWithInfo("Voice preset", "voice_preset")}</label>
        <select class="voice">${voiceSelectOptions(voiceId)}</select>
        <p class="hint voice-preset-hint">${escapeHtml(formatVoiceHint(voice))}</p>
      </div>
      <button type="button" class="remove" title="Remove line" aria-label="Remove line">✕</button>
    </div>
  `;

  const voiceSelect = row.querySelector(".voice");
  const hintEl = row.querySelector(".voice-preset-hint");
  voiceSelect.addEventListener("change", () => {
    const v = findVoice(voiceSelect.value);
    if (hintEl) hintEl.textContent = formatVoiceHint(v);
    row.dispatchEvent(new CustomEvent("line-voice-changed", { bubbles: true }));
  });

  row.querySelector(".remove").addEventListener("click", () => row.remove());
  return row;
}

export function readScriptLines(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return [...container.querySelectorAll(".line-row")].map((row) => ({
    speaker: row.querySelector(".speaker").value.trim() || "Speaker",
    voice_id: row.querySelector(".voice").value,
    text: row.querySelector(".text").value.trim(),
  }));
}

export function countDistinctVoiceIds(containerId) {
  const ids = readScriptLines(containerId)
    .filter((line) => line.text)
    .map((line) => line.voice_id);
  return new Set(ids).size;
}

export function fillScriptLines(containerId, kind, lines, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  lines.forEach((line) => {
    container.appendChild(
      createScriptLineRow(kind, {
        speaker: line.speaker,
        voice_id: line.voice_id,
        text: line.text,
      })
    );
  });
  if (onChange) onChange();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
