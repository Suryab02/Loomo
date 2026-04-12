/**
 * Loomo AI Job Tracker — Chrome Extension
 *
 * background.js (Service Worker)
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all API communication so popup.js stays lightweight.
 *
 * API contract (verified against backend source at /app/routes/):
 *   POST /jobs/parse-text  { text }            → { company, role, location, salary_range, platform, job_description }
 *   POST /jobs/             { company, role, … } → Job  (status defaults to "wishlist")
 *   GET  /insights/stats                        → { total, wishlist, applied, screening, interview, offer, rejected }
 *   GET  /auth/me                               → { id, email, full_name }
 *
 * Messages handled:
 *   SAVE_JOB  { text, url, title }  → { ok, job? } | { ok: false, error }
 *   SYNC_TOKEN { token, userEmail, userName, userId } → { ok }
 */

"use strict";

const LOOMO_API = "http://127.0.0.1:8000";

const PLATFORM_MAP = [
  ["linkedin",     "LinkedIn"],
  ["indeed",       "Indeed"],
  ["glassdoor",    "Glassdoor"],
  ["wellfound",    "Wellfound"],
  ["greenhouse",   "Greenhouse"],
  ["lever",        "Lever"],
  ["ziprecruiter", "ZipRecruiter"],
  ["workday",      "Workday"],
  ["naukri",       "Naukri"],
];

// ─────────────────────────────────────────────────────────────────────────────
// Message Router
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  switch (msg.action) {
    case "SAVE_JOB":
      saveJob(msg.data)
        .then(result => reply(result))
        .catch(err   => reply({ ok: false, error: err.message }));
      return true; // keep message channel open for async response

    case "SYNC_TOKEN":
      chrome.storage.local
        .set({
          token:     msg.data.token,
          userEmail: msg.data.userEmail,
          userName:  msg.data.userName,
          userId:    msg.data.userId,
        })
        .then(() => reply({ ok: true }))
        .catch(() => reply({ ok: false }));
      return true;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Core: Parse → Save
// ─────────────────────────────────────────────────────────────────────────────

async function saveJob({ text, url, title }) {
  // 1. Validate session
  const { token, geminiApiKey } = await chrome.storage.local.get(["token", "geminiApiKey"]);
  if (!token) throw new Error("Not logged in. Open the popup and sign in first.");

  let parsed = null;

  // 2. AI Parsing
  if (geminiApiKey) {
    // User provided their own key — parse locally to save backend budget
    try {
      parsed = await callGeminiApi(text, geminiApiKey);
    } catch (err) {
      console.error("Local Gemini failed, falling back to Loomo backend:", err);
    }
  }

  if (!parsed) {
    // Fallback to Loomo backend parsing
    const parseRes = await apiFetch("POST", "/jobs/parse-text", { text }, token);
    if (!parseRes.ok) {
      const body = await parseRes.json().catch(() => ({}));
      throw new Error(body.detail || "AI parsing failed. Please try again.");
    }
    parsed = await parseRes.json();
  }

  // Graceful fallback — if AI couldn't identify both fields, derive from page title
  if (!parsed.company && !parsed.role) {
    const [titleRole, titleCompany] = (title || "").split(" - ").map(s => s?.trim());
    parsed.role    = titleRole    || "Unknown Role";
    parsed.company = titleCompany || "Unknown Company";
  }

  // 3. Persist to DB — status defaults to "wishlist" on the backend
  const saveRes = await apiFetch("POST", "/jobs/", {
    company:         parsed.company         || "",
    role:            parsed.role            || "",
    location:        parsed.location        || "",
    salary_range:    parsed.salary_range    || "",
    platform:        parsed.platform        || detectPlatform(url),
    job_description: parsed.job_description || text.slice(0, 500),
    job_url:         url                    || "",
  }, token);

  if (saveRes.status === 409) {
    throw new Error("Already saved — this job is already in your Loomo dashboard.");
  }
  if (!saveRes.ok) {
    const body = await saveRes.json().catch(() => ({}));
    throw new Error(body.detail || "Save failed. Make sure your backend is running.");
  }

  const saved = await saveRes.json();

  // 4. Native success notification
  chrome.notifications.create(`loomo-${Date.now()}`, {
    type:    "basic",
    iconUrl: "icons/icon128.png",
    title:   "Saved to Loomo ✅",
    message: `${saved.role} at ${saved.company} — added to your Wishlist.`,
  });

  // 5. Broadcast to any open React tabs to refresh the Kanban board
  chrome.tabs.query({ url: ["http://localhost:5173/*", "http://127.0.0.1:5173/*"] }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "LOOMO_SYNC_REFRESH" }).catch(() => {});
    }
  });

  return { ok: true, job: saved };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Performs AI parsing locally using the user's Gemini API key.
 * This saves backend resources and uses the user's own model quota.
 */
async function callGeminiApi(text, apiKey) {
  const model = "gemini-1.5-flash"; // High speed, low cost for extraction
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
    You are Loomo's Job Extraction Agent. You MUST extract structured JSON data from messy web text.
    Return ONLY valid JSON. Note the clear sections for PAGE TITLE, HEADINGS, and BODY CONTENT.

    CRITICAL RULES:
    1. DO NOT swap 'company' and 'role'. The 'role' is the job title (e.g., 'Software Engineer'). The 'company' is the organization hiring (e.g., 'Automation Anywhere'). Look closely at the PAGE TITLE and HEADINGS to figure out which is which!
    2. Usually, the page title explicitly says "[Company] is hiring [Role]" or "[Role] | [Company]".

    FORMAT REQUIREMENTS:
    - "company": Full official company name. 
    - "role": Exact job title. 
    - "location": City and State (or "Remote" / "Hybrid").
    - "salary_range": Extract numbers/ranges if mentioned.
    - "platform": (e.g. LinkedIn, Indeed, etc.)
    - "job_description": The FULL actual job description text from the BODY CONTENT. Remove junk UI text like 'Apply', 'Show match details', but KEEP ALL responsibilities, requirements, and about us sections exactly as written.

    TEXT INPUT:
    ${text}
  `;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Gemini API failure");
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("No response from Gemini");

  return JSON.parse(content);
}

/**
 * Thin fetch wrapper that always sends JSON + Bearer token.
 */
function apiFetch(method, path, body, token) {
  return fetch(`${LOOMO_API}${path}`, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** Maps a URL to a human-readable platform label. */
function detectPlatform(url = "") {
  for (const [keyword, label] of PLATFORM_MAP) {
    if (url.includes(keyword)) return label;
  }
  return "Other";
}
