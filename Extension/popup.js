/**
 * popup.js — Loomo Extension Popup Controller
 *
 * Stats API response (verified against backend):
 *   { total, wishlist, applied, screening, interview, offer, rejected, response_rate }
 *
 * Save flow:
 *   1. Detect active tab URL → check if it's a job page
 *   2. For LinkedIn: extract currentJobId → build canonical /jobs/view/{id} URL
 *   3. Inline executeScript → extract text → background.js (parse + save)
 */

const API = "http://127.0.0.1:8000";

// ── URL Helpers ───────────────────────────────────────────────────────────────

function getLinkedInJobId(url) {
  if (!url.includes("linkedin.com")) return null;
  try {
    const u = new URL(url);
    return u.searchParams.get("currentJobId")
      || (u.pathname.match(/\/jobs\/view\/(\d+)/)?.[1] ?? null);
  } catch { return null; }
}

function canonicalUrl(url) {
  const id = getLinkedInJobId(url);
  return id ? `https://www.linkedin.com/jobs/view/${id}` : url;
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

async function apiFetch(path, token) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

function showView(viewId) {
  ["loginView", "dashView"].forEach(id => {
    const el = $(id);
    if (el) el.style.display = (id === viewId) ? "flex" : "none";
  });
}

function setBtnState(btn, state, label) {
  btn.textContent = label;
  btn.className   = `save-btn save-btn--${state}`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const { token, userName, userEmail } = await chrome.storage.local.get([
    "token", "userName", "userEmail",
  ]);

  if (!token) { showView("loginView"); return; }
  showView("dashView");

  const name = userName || userEmail?.split("@")[0] || "User";
  $("avatar").textContent   = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  $("userName").textContent = name;
  $("userEmail").textContent = userEmail || "";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tab?.url || "";

  $("saveSection").style.display = "block";
  $("hintSection").style.display = "none";
  const jobId = getLinkedInJobId(tabUrl);
  if (jobId) $("saveMeta").textContent = `LinkedIn Job #${jobId} detected. Ready to save.`;
  else $("saveMeta").textContent = `Ready to extract job details from this page.`;

  // Fetch stats from backend
  const stats = await apiFetch("/insights/stats", token);
  if (stats) {
    $("statWishlist").textContent  = stats.wishlist  ?? 0;
    $("statApplied").textContent   = stats.applied   ?? 0;
    $("statInterview").textContent = stats.interview ?? 0;
    $("statTotal").textContent     = stats.total     ?? 0;
  }
}

// ── Save Job ──────────────────────────────────────────────────────────────────

async function handleSaveJob() {
  const btn = $("saveJobBtn");
  btn.disabled = true;
  setBtnState(btn, "loading", "⏳  Scanning page...");

  try {
    const { token } = await chrome.storage.local.get("token");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Priority containers (highest priority first) to handle split-views like LinkedIn
        const SELECTORS = [
          ".job-view-layout", // LinkedIn split-view right panel
          ".jobs-description__container", // LinkedIn standalone wrapper
          ".jobs-search__job-details--container", // Alternate LinkedIn wrapper
          ".jobs-description-content__text", // Standard LinkedIn description
          "#jobDescriptionText", // Indeed
          ".job-body", 
          "main", 
          "[role='main']", 
          "#content"
        ];

        let targetNode = document.body;
        for (const sel of SELECTORS) {
          const el = document.querySelector(sel);
          if (el && el.innerText.trim().length > 200) {
            targetNode = el;
            break;
          }
        }

        // Only get headings from the targeted node to avoid sidebar noise
        const headings = Array.from(targetNode.querySelectorAll("h1, h2, h3, h4"))
          .slice(0, 8).map(h => h.innerText.trim()).filter(Boolean).join(" | ");
        
        const bodyContent = targetNode.innerText.trim().slice(0, 25000);
        
        const structuredText = `
--- PAGE TITLE ---
${document.title}

--- HEADINGS FOUND ---
${headings}

--- BODY CONTENT ---
${bodyContent}
`;
        return { text: structuredText, url: location.href, title: document.title };
      },
    });

    setBtnState(btn, "loading", "🧠  AI Analyzing...");

    const jobData = result.result;
    jobData.url = canonicalUrl(tab.url || jobData.url);

    setBtnState(btn, "loading", "💾  Saving to Loomo...");

    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: "SAVE_JOB", data: jobData }, resolve);
    });

    if (response?.ok) {
      setBtnState(btn, "success", "✅  Saved!");
      init(); // refresh stats
      setTimeout(() => setBtnState(btn, "default", "💾  Save This Job"), 3000);
    } else {
      throw new Error(response?.error || "Save failed.");
    }
  } catch (err) {
    setBtnState(btn, "error", "❌  " + err.message.slice(0, 20));
    setTimeout(() => setBtnState(btn, "default", "💾  Save This Job"), 3000);
  } finally {
    btn.disabled = false;
  }
}

// ── Event Listeners ───────────────────────────────────────────────────────────

$("loginBtn").addEventListener("click", () => chrome.tabs.create({ url: "http://localhost:5173/login" }));
$("dashBtn").addEventListener("click", () => chrome.tabs.create({ url: "http://localhost:5173/dashboard" }));
$("saveJobBtn").addEventListener("click", handleSaveJob);
$("logoutBtn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["token", "userEmail", "userName", "userId", "geminiApiKey"]);
  showView("loginView");
});

init();
