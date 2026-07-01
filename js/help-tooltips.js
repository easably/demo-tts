/** Info-icon tooltips for demo form labels. */

import { getConfig, tooltipText } from "./engine-config.js";

const BASE_TIPS = {
  voice_filter:
    "Book-safe hides legacy LJ Speech and dramatic fear presets. Use this when narrating a book with consistent studio sound.",
  default_narrator:
    "Target voice when you click Unify — sets the same book-safe preset on all lines or paragraphs.",
  scene_template: "Load a ready-made multi-line script. You can edit any line before Run scene.",
  pause_ms:
    "Silence between lines in the merged audio track. Higher values sound more like a pause between speakers.",
  acoustic_cfg:
    "How strongly the model follows the reference voice timbre. Lower (e.g. 1.3) = less of the sample's noise/color; higher = closer clone.",
  duration_cfg: "Controls pacing and length stability. Usually leave at 1.0.",
  flow_steps:
    "Quality vs speed. More steps = smoother audio, slower inference. 10 is the recommended default.",
  noise_temperature:
    "Randomness during generation. Lower (e.g. 0.75) can reduce gritty artifacts; does not remove hiss from the reference clip.",
  speed_up: "Optional faster speech. 0 = natural speed from the model.",
  normalize_text: "Pre-process punctuation and numbers for more stable reading.",
  book_paragraph: "Label for this block in the narration (not the voice identity).",
  tuning_profiles:
    "One-click generation settings. Stable book = lower noise + stronger reference lock for one narrator.",
  voice_catalog_section: "Filter presets and pick the default voice for Unify buttons.",
};

export function fieldTip(key) {
  const fromConfig = getConfig().tooltips?.[key];
  const raw = fromConfig ?? BASE_TIPS[key] ?? "";
  return tooltipText(key, raw);
}

export function infoIcon(tipKey) {
  const tip = fieldTip(tipKey);
  if (!tip) return "";
  return `<span class="info-tip" tabindex="0" role="note" aria-label="${escapeAttr(tip)}" data-tip="${escapeAttr(tip)}">ⓘ</span>`;
}

export function labelWithInfo(text, tipKey) {
  return `${text} ${infoIcon(tipKey)}`;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
