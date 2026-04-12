/**
 * Loomo AI Job Tracker — Chrome Extension
 *
 * syncToken.js (Content Script — injected into localhost:5173)
 * ─────────────────────────────────────────────────────────────
 * Reads the JWT from the Loomo web app's localStorage and pushes
 * it to the extension service worker via chrome.runtime.sendMessage,
 * along with the user's real name and email from /auth/me.
 *
 * Security notes:
 *  - Wrapped in IIFE to avoid global namespace pollution.
 *  - All chrome.runtime calls are guarded against extension reloads.
 *  - Errors are caught silently (backend may not be running locally).
 */

"use strict";

(function loomoSync() {
  const API = "http://127.0.0.1:8000";

  /** Sends auth session data to the background service worker. */
  async function sync() {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Bail out if the extension has been reloaded or is unavailable
    if (typeof chrome === "undefined" || !chrome.runtime?.id) return;

    // Fetch real user info to display name + email in the popup
    let user = { email: "", full_name: "", id: null };
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) user = await res.json();
    } catch {
      // Backend may not be running — still sync the token so the popup works
    }

    try {
      chrome.runtime.sendMessage(
        {
          action: "SYNC_TOKEN",
          data: {
            token,
            userEmail: user.email || "",
            userName:  user.full_name || user.email?.split("@")[0] || "",
            userId:    user.id ?? null,
            geminiApiKey: user.gemini_api_key || null,
          },
        },
        () => { void chrome.runtime.lastError; }, // suppress "no receiver" warning
      );
    } catch {
      // Extension context invalidated (reloaded mid-session) — ignore
    }
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else {
    sync();
  }

  // Re-sync when the token changes (e.g. user logs in without refreshing)
  window.addEventListener("storage", e => {
    if (e.key === "token") sync();
  });

  // Listen for broadcast messages from background.js to invalidate cache
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "LOOMO_SYNC_REFRESH") {
        window.dispatchEvent(new CustomEvent("loomo-job-saved"));
      }
    });
  }
})();
