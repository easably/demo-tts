/** Small DOM helpers shared across demo pages. */

export function $(id) {
  return document.getElementById(id);
}

export function setStatus(el, text, kind = "") {
  el.textContent = text;
  el.className = `status ${kind}`.trim();
}

export function showBanner(message, tone = "warn") {
  const toneClass = tone === "error" ? "banner-error" : tone === "ok" ? "banner-ok" : "banner-warn";
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="page-banner ${toneClass}" role="status">${message}</div>`
  );
}
