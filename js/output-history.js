/** Scrollable output list — newest audio on top, with download links. */

const MAX_ITEMS = 30;

export function prependAudioResult(containerId, { title, subtitle, audioUrl, downloadFilename }) {
  const list = document.getElementById(containerId);
  if (!list || !audioUrl) return;

  const cacheBust = Date.now();
  const url = audioUrl.includes("?") ? audioUrl : `${audioUrl}?t=${cacheBust}`;
  const filename = downloadFilename || "tada-output.wav";

  const item = document.createElement("li");
  item.className = "output-history-item";
  item.innerHTML = `
    <div class="output-history-meta">
      <div class="output-history-title">${escapeHtml(title)}</div>
      <div class="hint output-history-sub">${escapeHtml(subtitle)}</div>
      <a class="download-link" href="${url}" download="${escapeAttr(filename)}">Download WAV</a>
    </div>
    <audio controls preload="metadata" src="${url}"></audio>
  `;

  list.querySelectorAll(".output-history-item--latest").forEach((el) => {
    el.classList.remove("output-history-item--latest");
  });
  item.classList.add("output-history-item--latest");
  list.prepend(item);

  while (list.children.length > MAX_ITEMS) {
    list.lastElementChild?.remove();
  }

  list.classList.remove("hidden");
  item.querySelector("audio")?.play().catch(() => {});
}

export function clearOutputHistory(containerId) {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = "";
  list.classList.add("hidden");
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
