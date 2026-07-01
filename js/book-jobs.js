/** Audiobook background jobs — order, poll, download. */

import { apiRequest } from "./api-client.js";
import { apiBase } from "./engine-config.js";

const POLL_MS = 2500;
let pollTimer = null;
let activeJobId = null;

const $ = (id) => document.getElementById(id);

function setStatus(text, kind = "") {
  const el = $("order-status");
  if (!el) return;
  el.textContent = text;
  el.className = kind ? `hint ${kind}` : "hint";
}

async function loadBooks() {
  const data = await apiRequest("/api/books");
  const select = $("book-select");
  select.innerHTML = data.books
    .map(
      (b) =>
        `<option value="${b.slug}" data-levels="${(b.bundled_levels || []).join(",")}">${b.title} — ${b.subtitle || b.slug}</option>`
    )
    .join("");
  select.addEventListener("change", syncLevels);
  syncLevels();
}

function syncLevels() {
  const opt = $("book-select").selectedOptions[0];
  const levels = (opt?.dataset.levels || "a1").split(",").filter(Boolean);
  $("level-select").innerHTML = levels.map((l) => `<option value="${l}">${l.toUpperCase()}</option>`).join("");
  loadBookDetail();
}

async function loadVoices() {
  const presets = await apiRequest("/api/presets");
  const voices = presets.voices.filter((v) => v.narration_recommended !== false && v.sample_available);
  $("voice-select").innerHTML = voices
    .map((v) => `<option value="${v.id}">${v.label || v.id}</option>`)
    .join("");
}

async function loadBookDetail() {
  const slug = $("book-select").value;
  const level = $("level-select").value;
  if (!slug || !level) return;
  try {
    const detail = await apiRequest(`/api/books/${slug}/${level}`);
    const castEl = $("cast-preview");
    if ($("mode-select").value === "directed" && detail.voice_cast) {
      castEl.classList.remove("hidden");
      castEl.innerHTML = Object.entries(detail.voice_cast)
        .map(([speaker, voice]) => `<div><strong>${speaker}</strong> → ${voice}</div>`)
        .join("");
    } else {
      castEl.classList.add("hidden");
    }
    setStatus(
      `${detail.title} (${level.toUpperCase()}): ${detail.chunk_count} chapters` +
        (detail.has_direction ? `, directed script available` : "")
    );
  } catch (err) {
    setStatus(err.message, "err");
  }
}

function renderJob(job) {
  const prog = job.progress || {};
  const total = prog.total || 1;
  const current = prog.current || 0;
  const pct = job.status === "completed" ? 100 : Math.min(99, Math.round((current / total) * 100));
  const downloads =
    job.status === "completed"
      ? `<p>
          <a class="btn secondary" href="${apiBase()}${job.download_urls.mp3}" download>Download MP3</a>
          <a class="btn secondary" href="${apiBase()}${job.download_urls.wav}" download>Download WAV</a>
        </p>`
      : "";

  return `
    <div class="job-card">
      <p><strong>${job.title || job.book_slug}</strong> · ${job.level.toUpperCase()} · <span class="job-status-${job.status}">${job.status}</span></p>
      <p class="hint">${prog.stage || ""} ${job.error ? "— " + job.error : ""}</p>
      <div class="progress-bar"><span style="width:${pct}%"></span></div>
      <p class="hint">Job <code>${job.job_id}</code></p>
      ${downloads}
    </div>
  `;
}

async function refreshJob(jobId) {
  const job = await apiRequest(`/api/jobs/${jobId}`);
  $("active-job").innerHTML = renderJob(job);
  if (job.status === "queued" || job.status === "running") {
    pollTimer = setTimeout(() => refreshJob(jobId), POLL_MS);
  } else {
    pollTimer = null;
    loadJobsList();
  }
  return job;
}

async function loadJobsList() {
  const data = await apiRequest("/api/jobs?limit=10");
  const ul = $("jobs-list");
  if (!data.jobs?.length) {
    ul.innerHTML = "<li class='hint'>No jobs yet.</li>";
    return;
  }
  ul.innerHTML = data.jobs.map((j) => `<li>${renderJob(j)}</li>`).join("");
}

async function startJob() {
  const button = $("start-job");
  button.disabled = true;
  setStatus("Submitting job…", "busy");

  const body = {
    book_slug: $("book-select").value,
    level: $("level-select").value,
    mode: $("mode-select").value,
    pause_ms: Number($("pause-ms").value),
  };
  if (body.mode === "chunks") {
    body.voice_id = $("voice-select").value;
  }

  try {
    const job = await apiRequest("/api/jobs/book", { method: "POST", body: JSON.stringify(body) });
    activeJobId = job.job_id;
    setStatus(`Job started: ${job.job_id}`, "ok");
    if (pollTimer) clearTimeout(pollTimer);
    refreshJob(job.job_id);
    loadJobsList();
  } catch (err) {
    setStatus(err.message, "err");
  } finally {
    button.disabled = false;
  }
}

function bindUi() {
  $("mode-select").addEventListener("change", () => {
    const directed = $("mode-select").value === "directed";
    $("voice-label").classList.toggle("hidden", directed);
    loadBookDetail();
  });
  $("level-select").addEventListener("change", loadBookDetail);
  $("start-job").addEventListener("click", startJob);
}

async function init() {
  bindUi();
  await Promise.all([loadBooks(), loadVoices()]);
}

init().catch((err) => setStatus(err.message, "err"));
