/**
 * Unified speech studio: one-line TTS and multi-speaker dialogue on the same panel.
 */

import { apiRequest } from "./api-client.js";
import { $, setStatus } from "./dom-utils.js";
import { voiceCatalog, bindVoicePreview, voiceSelectOptions } from "./voice-catalog.js";
import {
  createScriptLineRow,
  fillScriptLines,
  readScriptLines,
} from "./line-editor.js";
import {
  addSequenceToHistory,
  renderDialogueScriptPreview,
  renderSequenceDetails,
  voiceLabel,
} from "./sequence-results.js";
import { prependAudioResult } from "./output-history.js";
import { copyText, getConfig } from "./engine-config.js";
import { labelWithInfo } from "./help-tooltips.js";
import { readSynthesisOptions } from "./synthesis-settings.js";

const HISTORY_ID = "studio-output-history";

function defaultSingleText() {
  return copyText(
    "singleLineDefaultText",
    "Natural speech with cloned intonation and reliable text alignment."
  );
}

function defaultDialogueExampleId() {
  return getConfig().defaults?.dialogueExampleId || "";
}

let activeMode = "single";

export function initSpeechStudio() {
  injectSingleLineLabels();
  injectDialogueToolbarLabels();
  bindModeSwitcher();
  bindSingleLineMode();
  bindDialogueMode();
  loadDefaultDialogueExample();
}

function injectSingleLineLabels() {
  const voiceLabelEl = document.querySelector('label[for="single-voice"]');
  if (voiceLabelEl) {
    voiceLabelEl.innerHTML = labelWithInfo("Voice / intonation preset", "voice_preset");
  }
  const textLabel = document.querySelector('label[for="single-text"]');
  if (textLabel) {
    textLabel.innerHTML = labelWithInfo("Text to speak", "spoken_text");
  }
}

function injectDialogueToolbarLabels() {
  const templateLabel = document.querySelector("#studio-mode-dialogue label:has(#dialogue-example)");
  if (templateLabel) {
    templateLabel.childNodes[0].textContent = "";
    templateLabel.insertAdjacentHTML("afterbegin", `${labelWithInfo("Scene template", "scene_template")} `);
  }
  const pauseLabel = document.querySelector("#studio-mode-dialogue label:has(#dialogue-pause-ms)");
  if (pauseLabel) {
    pauseLabel.childNodes[0].textContent = "";
    pauseLabel.insertAdjacentHTML("afterbegin", `${labelWithInfo("Pause between lines (ms)", "pause_ms")} `);
  }
}

function bindModeSwitcher() {
  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setStudioMode(button.dataset.mode);
    });
  });
}

function setStudioMode(mode) {
  activeMode = mode;
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  $("studio-mode-single").classList.toggle("active", mode === "single");
  $("studio-mode-dialogue").classList.toggle("active", mode === "dialogue");
  $("studio-run-single").classList.toggle("hidden", mode !== "single");
  $("studio-run-dialogue").classList.toggle("hidden", mode !== "dialogue");
  $("studio-sequence-details").classList.add("hidden");
  setStatus($("studio-status"), "Ready — latest audio appears at the top of the list on the right.");
}

function bindSingleLineMode() {
  $("single-voice").innerHTML = voiceSelectOptions();
  bindVoicePreview("single-voice", "single-voice-desc", "single-voice-preview");
  $("single-text").value = defaultSingleText();
  $("studio-run-single").addEventListener("click", generateSingleLine);
}

function bindDialogueMode() {
  const exampleSelect = $("dialogue-example");
  exampleSelect.innerHTML =
    `<option value="">— write your own —</option>` +
    voiceCatalog.dialogueExamples
      .map((example) => `<option value="${example.id}">${example.title}</option>`)
      .join("");

  exampleSelect.addEventListener("change", () => {
    if (exampleSelect.value) {
      loadDialogueExample(exampleSelect.value);
    } else {
      refreshDialoguePreview();
    }
  });

  $("dialogue-add-line").addEventListener("click", () => {
    $("dialogue-lines").appendChild(createScriptLineRow("dialogue"));
    refreshDialoguePreview();
  });

  $("dialogue-lines").addEventListener("input", refreshDialoguePreview);
  $("studio-run-dialogue").addEventListener("click", generateDialogueScene);
}

function loadDefaultDialogueExample() {
  const exampleSelect = $("dialogue-example");
  const exampleId = defaultDialogueExampleId();
  const hasShowcase = exampleId && voiceCatalog.dialogueExamples.some((ex) => ex.id === exampleId);

  if (hasShowcase) {
    exampleSelect.value = exampleId;
    loadDialogueExample(exampleId);
    setStudioMode("dialogue");
    return;
  }

  if (voiceCatalog.dialogueExamples[0]) {
    exampleSelect.value = voiceCatalog.dialogueExamples[0].id;
    loadDialogueExample(voiceCatalog.dialogueExamples[0].id);
    setStudioMode("dialogue");
    return;
  }

  $("dialogue-lines").appendChild(createScriptLineRow("dialogue"));
  refreshDialoguePreview();
}

function loadDialogueExample(exampleId) {
  const example = voiceCatalog.dialogueExamples.find((item) => item.id === exampleId);
  if (!example) return;

  fillScriptLines("dialogue-lines", "dialogue", example.lines, refreshDialoguePreview);
  $("dialogue-pause-ms").value = example.pause_ms || 450;
  refreshDialoguePreview();
}

function refreshDialoguePreview() {
  const lines = readScriptLines("dialogue-lines").filter((line) => line.text);
  renderDialogueScriptPreview($("dialogue-script-preview"), lines);
}

async function generateSingleLine() {
  const status = $("studio-status");
  const button = $("studio-run-single");
  const text = $("single-text").value.trim();
  const voiceId = $("single-voice").value;

  if (!text) {
    setStatus(status, "Enter text to speak.", "err");
    return;
  }

  button.disabled = true;
  $("studio-sequence-details").classList.add("hidden");
  setStatus(status, "Generating… (first GPU run may take a few minutes)", "busy");

  try {
    const data = await apiRequest("/api/tts", {
      method: "POST",
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        options: readSynthesisOptions(),
      }),
    });

    const voiceName = voiceLabel(voiceId);
    prependAudioResult(HISTORY_ID, {
      title: `One line · ${voiceName}`,
      subtitle: `${data.line.duration_sec}s · ${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`,
      audioUrl: data.line.audio_url,
      downloadFilename: `tada-${voiceId}-${data.session_id}.wav`,
    });

    setStatus(status, `Done · ${data.line.duration_sec}s · ${voiceName}`, "ok");
  } catch (err) {
    setStatus(status, err.message, "err");
  } finally {
    button.disabled = false;
  }
}

async function generateDialogueScene() {
  const lines = readScriptLines("dialogue-lines").filter((line) => line.text);
  if (!lines.length) {
    setStatus($("studio-status"), "Add at least one line with spoken text.", "err");
    return;
  }

  const button = $("studio-run-dialogue");
  const status = $("studio-status");
  const exampleTitle =
    voiceCatalog.dialogueExamples.find((ex) => ex.id === $("dialogue-example").value)?.title ||
    "Custom dialogue";

  button.disabled = true;
  setStatus(status, "Running scene… each line may take ~1–2 s on GPU", "busy");

  try {
    const data = await apiRequest("/api/dialogue", {
      method: "POST",
      body: JSON.stringify({
        lines,
        pause_ms: Number($("dialogue-pause-ms").value),
        options: readSynthesisOptions(),
      }),
    });

    addSequenceToHistory(HISTORY_ID, data, exampleTitle);
    renderSequenceDetails($("studio-sequence-details"), data);
    setStatus(
      status,
      `Scene ready · ${data.lines.length} lines · merged ${data.merged_duration_sec}s — see history above`,
      "ok"
    );
  } catch (err) {
    setStatus(status, err.message, "err");
  } finally {
    button.disabled = false;
  }
}
