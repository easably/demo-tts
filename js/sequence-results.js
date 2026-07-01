/** Dialogue script preview + optional inline sequence details. */

import { findVoice } from "./voice-catalog.js";
import { prependAudioResult } from "./output-history.js";

export function voiceLabel(voiceId) {
  return findVoice(voiceId)?.label || voiceId;
}

export function addSequenceToHistory(historyId, data, sceneTitle) {
  const speakers = [...new Set(data.lines.map((l) => l.speaker))].join(", ");
  const voices = [...new Set(data.lines.map((l) => voiceLabel(l.voice_id)))].join(" · ");

  prependAudioResult(historyId, {
    title: sceneTitle,
    subtitle: `${data.lines.length} lines · ${data.merged_duration_sec}s · ${speakers} · voices: ${voices}`,
    audioUrl: data.merged_audio_url,
    downloadFilename: `tada-scene-${data.session_id}.wav`,
  });
}

export function renderSequenceDetails(container, data) {
  if (!container) return;
  container.classList.remove("hidden");
  const cacheBust = `t=${Date.now()}`;

  const linesHtml = data.lines
    .map(
      (line) => `
      <div class="line-result">
        <div class="line-meta">
          <strong>${escapeHtml(line.speaker)}</strong>
          · <em>${escapeHtml(voiceLabel(line.voice_id))}</em>
          · ${line.duration_sec}s
          <div class="hint">${escapeHtml(line.text)}</div>
        </div>
        <audio controls src="${line.audio_url}?${cacheBust}"></audio>
      </div>`
    )
    .join("");

  container.innerHTML = `
    <details class="sequence-details" open>
      <summary>Line-by-line breakdown</summary>
      ${linesHtml}
    </details>
  `;
}

export function renderDialogueScriptPreview(container, lines) {
  if (!container) return;
  if (!lines.length) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  const scriptHtml = lines
    .map((line) => {
      const voiceName = voiceLabel(line.voice_id);
      return `<p class="script-line"><strong>${escapeHtml(line.speaker)}</strong> <span class="script-voice">speaks as «${escapeHtml(voiceName)}»</span>: ${escapeHtml(line.text)}</p>`;
    })
    .join("");

  container.innerHTML = `
    <p class="script-preview-title">Script preview — each line uses its own voice preset</p>
    <div class="script-preview-body">${scriptHtml}</div>
  `;
  container.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
