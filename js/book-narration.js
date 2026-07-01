/** Book narration tab — multi-paragraph scenes with different voices. */

import { apiRequest } from "./api-client.js";
import { $ } from "./dom-utils.js";
import { voiceCatalog } from "./voice-catalog.js";
import {
  countDistinctVoiceIds,
  createScriptLineRow,
  fillScriptLines,
  readScriptLines,
} from "./line-editor.js";
import { addSequenceToHistory, renderSequenceDetails, voiceLabel } from "./sequence-results.js";
import {
  readSynthesisOptions,
  switchToTuningTab,
  unifyBookParagraphs,
} from "./synthesis-settings.js";

const HISTORY_ID = "book-output-history";
const DEFAULT_BOOK_EXAMPLE = "opening_clean";

export function initBookNarration() {
  const exampleSelect = $("book-example");
  exampleSelect.innerHTML =
    `<option value="">— custom narration —</option>` +
    voiceCatalog.bookExamples.map((example) => `<option value="${example.id}">${example.title}</option>`).join("");

  exampleSelect.addEventListener("change", () => {
    if (exampleSelect.value) loadBookExample(exampleSelect.value);
    else updateBookVoiceWarning();
  });

  $("book-add-paragraph").addEventListener("click", () => {
    $("book-lines").appendChild(createScriptLineRow("book"));
    updateBookVoiceWarning();
  });

  $("book-lines").addEventListener("line-voice-changed", updateBookVoiceWarning);
  document.addEventListener("book-lines-changed", updateBookVoiceWarning);

  $("book-unify-voices")?.addEventListener("click", () => {
    unifyBookParagraphs();
    updateBookVoiceWarning();
  });

  $("book-open-tuning")?.addEventListener("click", switchToTuningTab);
  $("book-run-narration").addEventListener("click", generateBookNarration);

  if (voiceCatalog.bookExamples.some((ex) => ex.id === DEFAULT_BOOK_EXAMPLE)) {
    exampleSelect.value = DEFAULT_BOOK_EXAMPLE;
    loadBookExample(DEFAULT_BOOK_EXAMPLE);
  } else if (voiceCatalog.bookExamples[0]) {
    exampleSelect.value = voiceCatalog.bookExamples[0].id;
    loadBookExample(voiceCatalog.bookExamples[0].id);
  } else {
    $("book-lines").appendChild(createScriptLineRow("book"));
    updateBookVoiceWarning();
  }
}

function loadBookExample(exampleId) {
  const example = voiceCatalog.bookExamples.find((item) => item.id === exampleId);
  if (!example) return;

  fillScriptLines(
    "book-lines",
    "book",
    example.blocks.map((block, index) => ({
      speaker: `Paragraph ${index + 1}`,
      voice_id: block.voice_id,
      text: block.text,
    }))
  );
  $("book-pause-ms").value = example.pause_ms || 600;
  updateBookVoiceWarning();
}

function updateBookVoiceWarning() {
  const banner = $("book-voice-warning");
  if (!banner) return;

  const lines = readScriptLines("book-lines").filter((line) => line.text);
  const distinct = countDistinctVoiceIds("book-lines");
  if (lines.length < 2 || distinct <= 1) {
    banner.classList.add("hidden");
    banner.textContent = "";
    return;
  }

  const voiceNames = [...new Set(lines.map((l) => voiceLabel(l.voice_id)))];
  banner.classList.remove("hidden");
  banner.innerHTML = `
    <strong>${distinct} different voice presets</strong> in this narration
    (${voiceNames.map((v) => escapeHtml(v)).join(" · ")}).
    Each preset uses a <em>different reference clip</em> — it may sound like different narrators.
    For one voice: click <strong>Use one voice for all</strong> or open <strong>Voice tuning</strong>.
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function generateBookNarration() {
  const lines = readScriptLines("book-lines").filter((line) => line.text);
  if (!lines.length) {
    alert("Add at least one paragraph with text.");
    return;
  }

  const button = $("book-run-narration");
  const title =
    voiceCatalog.bookExamples.find((ex) => ex.id === $("book-example").value)?.title ||
    "Book narration";

  button.disabled = true;
  button.textContent = "Generating narration…";

  try {
    const data = await apiRequest("/api/book", {
      method: "POST",
      body: JSON.stringify({
        lines,
        pause_ms: Number($("book-pause-ms").value),
        options: readSynthesisOptions(),
      }),
    });
    addSequenceToHistory(HISTORY_ID, data, title);
    renderSequenceDetails($("book-sequence-details"), data);
  } catch (err) {
    alert(err.message);
  } finally {
    button.disabled = false;
    button.textContent = "Generate book narration";
  }
}
