const MAX_ROWS = 300;
const rows = [];
let eventSource = null;

function $(id) {
  return document.getElementById(id);
}

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("ru-RU", { hour12: false, fractionalSecondDigits: 3 });
}

function fmtMs(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  return `${Math.round(ms)} ms`;
}

function fmtRtf(rtf) {
  if (rtf == null || Number.isNaN(rtf)) return "—";
  const cls = rtf <= 1 ? "rtf-ok" : "rtf-slow";
  return `<span class="${cls}">${rtf.toFixed(2)}</span>`;
}

function eventClass(event) {
  return `ev-${event.replace(/_/g, "-")}`;
}

function queueCell(entry) {
  const parts = [];
  if (entry.queue_depth != null) parts.push(`q=${entry.queue_depth}`);
  if (entry.wait_ms != null) parts.push(`wait ${fmtMs(entry.wait_ms)}`);
  return parts.join(" · ") || "—";
}

function lineCell(entry) {
  if (entry.line_index != null && entry.line_total != null) {
    return `${entry.line_index + 1}/${entry.line_total}`;
  }
  if (entry.lines_count != null) return `${entry.lines_count} lines`;
  if (entry.text_chars != null) return `${entry.text_chars} chars`;
  return "—";
}

function voiceCell(entry) {
  const parts = [];
  if (entry.speaker) parts.push(entry.speaker);
  if (entry.voice_id) parts.push(entry.voice_id);
  if (entry.voice_ids?.length) parts.push(entry.voice_ids.join(", "));
  return parts.join(" · ") || "—";
}

function detailsCell(entry) {
  const skip = new Set([
    "ts", "event", "queue_depth", "wait_ms", "line_index", "line_total",
    "speaker", "voice_id", "voice_ids", "inference_ms", "rtf",
    "num_flow_matching_steps", "flow_steps", "vram_mb", "text_chars", "lines_count",
  ]);
  const extra = Object.entries(entry)
    .filter(([k, v]) => !skip.has(k) && v != null && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
  return extra || "—";
}

function rowHtml(entry) {
  const flow = entry.num_flow_matching_steps ?? entry.flow_steps;
  return `<tr class="${eventClass(entry.event)}">
    <td class="mono">${fmtTime(entry.ts)}</td>
    <td><span class="ev-badge">${entry.event}</span></td>
    <td class="mono">${queueCell(entry)}</td>
    <td class="mono">${lineCell(entry)}</td>
    <td>${voiceCell(entry)}</td>
    <td class="mono">${fmtMs(entry.inference_ms)}</td>
    <td class="mono">${fmtRtf(entry.rtf)}</td>
    <td class="mono">${flow ?? "—"}</td>
    <td class="mono">${entry.vram_mb != null ? `${entry.vram_mb} MB` : "—"}</td>
    <td class="details-cell">${detailsCell(entry)}</td>
  </tr>`;
}

function passesFilter(entry) {
  const filter = $("event-filter").value;
  return !filter || entry.event === filter;
}

function scrollLogs() {
  const wrap = $("logs-scroll");
  if (wrap && $("live-toggle").checked) {
    wrap.scrollTop = wrap.scrollHeight;
  }
}

function renderRows() {
  const body = $("logs-body");
  const filtered = rows.filter(passesFilter);
  body.innerHTML = filtered.map(rowHtml).join("");
  $("logs-empty").classList.toggle("hidden", filtered.length > 0);
  scrollLogs();
}

function pushEntry(entry) {
  rows.push(entry);
  while (rows.length > MAX_ROWS) rows.shift();
  if (passesFilter(entry)) {
    const body = $("logs-body");
    body.insertAdjacentHTML("beforeend", rowHtml(entry));
    while (body.rows.length > MAX_ROWS) body.deleteRow(0);
    $("logs-empty").classList.add("hidden");
    scrollLogs();
  }
}

async function refreshStatus() {
  try {
    const data = await fetch("/api/ops/status").then((r) => r.json());
    $("stat-gpu").textContent = data.busy ? "Занят" : "Свободен";
    $("stat-gpu").className = `stat-value ${data.busy ? "busy" : "idle"}`;
    $("stat-vram").textContent =
      data.vram_allocated_mb != null
        ? `${data.vram_allocated_mb} / ${data.vram_total_mb ?? "?"} MB`
        : "—";
    $("stat-queue").textContent = String(data.queue_depth ?? 0);
    $("stat-model").textContent = data.model ?? "—";
    $("stat-rtf").textContent =
      data.last_rtf != null ? data.last_rtf.toFixed(2) : "—";
    $("stat-requests").textContent = String(data.requests_total ?? 0);
  } catch {
    /* status poll is best-effort */
  }
}

async function loadHistory() {
  const filter = $("event-filter").value;
  const qs = new URLSearchParams({ limit: "200" });
  if (filter) qs.set("event", filter);
  const data = await fetch(`/api/ops/logs?${qs}`).then((r) => r.json());
  rows.length = 0;
  rows.push(...(data.entries || []));
  renderRows();
}

function setConnStatus(text, kind) {
  const el = $("conn-status");
  el.textContent = text;
  el.className = `conn-status ${kind || ""}`.trim();
}

function connectStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (!$("live-toggle").checked) {
    setConnStatus("Live выкл.", "");
    return;
  }
  eventSource = new EventSource("/api/ops/logs/stream");
  eventSource.onopen = () => setConnStatus("Live", "ok");
  eventSource.onerror = () => setConnStatus("Переподключение…", "warn");
  eventSource.onmessage = (ev) => {
    try {
      pushEntry(JSON.parse(ev.data));
      refreshStatus();
    } catch (err) {
      console.warn("bad log event", err);
    }
  };
}

function bindUi() {
  $("btn-clear").addEventListener("click", () => {
    rows.length = 0;
    $("logs-body").innerHTML = "";
    $("logs-empty").classList.remove("hidden");
  });
  $("btn-refresh").addEventListener("click", () => {
    loadHistory().catch(console.error);
    refreshStatus();
  });
  $("event-filter").addEventListener("change", () => loadHistory().catch(console.error));
  $("live-toggle").addEventListener("change", connectStream);
}

async function init() {
  bindUi();
  await loadHistory();
  await refreshStatus();
  connectStream();
  setInterval(refreshStatus, 5000);
}

init().catch((err) => {
  console.error(err);
  setConnStatus(err.message, "err");
});
