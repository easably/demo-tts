/** Thin fetch wrapper for the shared TTS REST API (v1). */

import { apiBase } from "./engine-config.js";

export async function apiRequest(path, options = {}) {
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    const message = typeof detail === "string" ? detail : data.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}
