/* Watertight -- Electron renderer.
 *
 * Drives the UI and delegates: HTTP through Watertight.Client (shared core),
 * disk writes through wtNative (preload bridge). No Node access here.
 */
"use strict";

const W = window.Watertight;
const native = window.wtNative;

const $ = (id) => document.getElementById(id);

const el = {
  status: $("status"), statusText: $("statusText"),
  dropzone: $("dropzone"), fileInput: $("fileInput"),
  workingCard: $("workingCard"), workingWhat: $("workingWhat"),
  errorCard: $("errorCard"), errorText: $("errorText"),
  savedBanner: $("savedBanner"), savedPath: $("savedPath"),
  results: $("results"), resultActions: $("resultActions"),
  settingsCard: $("settingsCard"),
  baseUrl: $("baseUrl"), token: $("token"),
  autoSave: $("autoSave"), revealAfterSave: $("revealAfterSave"),
  testResult: $("testResult"),
  footVersion: $("footVersion"), footServer: $("footServer"),
};

let settings = { baseUrl: "", token: "", autoSave: true, revealAfterSave: false };
let downloadsDir = "~/Downloads";
let lastSavedPath = null;
let lastResult = null;   // { blob, report, filename } for "Save as…"
let busy = false;

const client = new W.Client(() => ({ baseUrl: settings.baseUrl, token: settings.token }));

/* ── Chrome ────────────────────────────────────────────────────────────── */

$("brandIcon").innerHTML = W.svg.drop;
$("dropArrow").innerHTML = W.svg.arrow;
$("savedIcon").innerHTML = W.svg.ok;

function show(node, visible) {
  node.classList.toggle("hidden", !visible);
}

function setStatus(state, text) {
  el.status.dataset.state = state;
  el.statusText.textContent = text;
}

function setBusy(on, what) {
  busy = on;
  el.dropzone.classList.toggle("disabled", on);
  show(el.workingCard, on);
  if (what) el.workingWhat.textContent = what;
  if (on) setStatus("busy", "Working…");
}

function clearOutput() {
  el.results.innerHTML = "";
  show(el.errorCard, false);
  show(el.savedBanner, false);
  show(el.resultActions, false);
  lastSavedPath = null;
}

function fail(message) {
  setBusy(false);
  el.errorText.textContent = message;
  show(el.errorCard, true);
  setStatus("offline", "Error");
}

/* ── Health ────────────────────────────────────────────────────────────── */

async function checkHealth(quiet = true) {
  if (!settings.baseUrl) {
    setStatus("offline", "No server set");
    return null;
  }
  setStatus("idle", "Connecting…");
  try {
    const h = await client.health();
    setStatus("ok", "Connected");
    el.footServer.textContent = settings.baseUrl.replace(/^https?:\/\//, "");
    if (h.auth_required && !settings.token) {
      setStatus("offline", "Token required");
    }
    if (!h.pymeshfix) {
      console.warn("Server lacks PyMeshFix; severe damage cannot be repaired.");
    }
    return h;
  } catch (e) {
    setStatus("offline", "Server unreachable");
    if (!quiet) fail(
      "Could not reach the Watertight server at " + settings.baseUrl +
      ". Check that you are connected to Tailscale and that the address in " +
      "Settings is correct."
    );
    return null;
  }
}

/* ── The main flow ─────────────────────────────────────────────────────── */

async function handleFile(file) {
  if (busy) return;
  if (!W.looksLikeStl(file)) {
    clearOutput();
    fail(`"${file.name}" is not an .stl file. Watertight only repairs STL meshes.`);
    return;
  }
  if (!settings.baseUrl) {
    clearOutput();
    fail("No server address is set. Open Settings and enter the server address.");
    return;
  }

  clearOutput();
  setBusy(true, `Uploading ${file.name}…`);

  // The server does analysis and repair in one call, so the UI just narrates.
  const narrate = setTimeout(
    () => setBusy(true, "Analysing and repairing — large meshes can take a minute…"),
    1200
  );

  try {
    const res = await client.repair(file, { dropDebris: true, allowRebuild: true });
    clearTimeout(narrate);
    lastResult = res;

    if (res.report) {
      el.results.innerHTML = W.reportHtml(res.report, file.name);
    } else {
      el.results.innerHTML =
        '<div class="verdict warn">' + W.svg.warn +
        "<div><div class=\"title\">Repaired, but no report came back</div>" +
        "<div class=\"sub\">The fixed file is fine; the server did not send details.</div></div></div>";
    }

    setBusy(false);
    setStatus("ok", "Connected");
    show(el.resultActions, true);

    // Auto-save only makes sense if we actually produced a usable mesh; a
    // failed repair still gets offered, but never silently dropped in
    // Downloads where a student might print it by mistake.
    if (settings.autoSave && res.report && res.report.success !== false) {
      await saveResult(false);
    } else if (settings.autoSave) {
      el.workingWhat.textContent = "";
    }
  } catch (e) {
    clearTimeout(narrate);
    fail(e && e.message ? e.message : String(e));
  }
}

async function saveResult(saveAs) {
  if (!lastResult) return;
  try {
    const bytes = new Uint8Array(await lastResult.blob.arrayBuffer());
    const out = await native.saveFile(lastResult.filename, bytes, saveAs);
    if (out.canceled) return;
    lastSavedPath = out.path;
    el.savedPath.textContent = out.path;
    show(el.savedBanner, true);
  } catch (e) {
    fail("Could not save the file: " + (e.message || e));
  }
}

/* ── Settings panel ────────────────────────────────────────────────────── */

function openSettings() {
  el.baseUrl.value = settings.baseUrl || "";
  el.token.value = settings.token || "";
  el.autoSave.checked = !!settings.autoSave;
  el.revealAfterSave.checked = !!settings.revealAfterSave;
  el.testResult.textContent = "";
  show(el.settingsCard, true);
  el.baseUrl.focus();
}

async function commitSettings() {
  settings = await native.setSettings({
    baseUrl: el.baseUrl.value,
    token: el.token.value,
    autoSave: el.autoSave.checked,
    revealAfterSave: el.revealAfterSave.checked,
  });
  show(el.settingsCard, false);
  await checkHealth(true);
}

/* ── Events ────────────────────────────────────────────────────────────── */

W.wireDropzone(el.dropzone, el.fileInput, handleFile);

$("settingsBtn").addEventListener("click", () =>
  el.settingsCard.classList.contains("hidden") ? openSettings() : show(el.settingsCard, false)
);
$("closeSettingsBtn").addEventListener("click", () => show(el.settingsCard, false));
$("saveSettingsBtn").addEventListener("click", commitSettings);

$("testBtn").addEventListener("click", async () => {
  // Test against what is typed, not what is saved, so students can verify
  // before committing.
  const typed = { baseUrl: el.baseUrl.value.trim(), token: el.token.value.trim() };
  const probe = new W.Client(() => typed);
  el.testResult.textContent = "Testing…";
  el.testResult.className = "";
  try {
    const h = await probe.health();
    if (h.auth_required && !typed.token) {
      el.testResult.textContent = "Server reached, but it requires an access token.";
      el.testResult.className = "error-text";
      return;
    }
    el.testResult.style.color = "var(--ok)";
    el.testResult.textContent =
      `Connected. Watertight ${h.version} — up to ${h.max_upload_mb} MB per file` +
      (h.pymeshfix ? "" : " (warning: PyMeshFix missing on server)");
  } catch (e) {
    el.testResult.className = "error-text";
    el.testResult.textContent = "Could not connect: " + (e.message || e);
  }
});

$("anotherBtn").addEventListener("click", () => { clearOutput(); el.fileInput.click(); });
$("saveAsBtn").addEventListener("click", () => saveResult(true));
$("revealBtn").addEventListener("click", () => lastSavedPath && native.reveal(lastSavedPath));
$("errorRetry").addEventListener("click", () => { clearOutput(); el.fileInput.click(); });
$("errorSettings").addEventListener("click", openSettings);

native.onOpenSettings(openSettings);
native.onOpenFileDialog(async () => {
  const picked = await native.openStlDialog();
  if (!picked) return;
  // Rebuild a File so the shared client can post it like any drop.
  handleFile(new File([picked.bytes], picked.name, { type: "model/stl" }));
});

/* ── Boot ──────────────────────────────────────────────────────────────── */

(async function boot() {
  const s = await native.getSettings();
  settings = s;
  downloadsDir = s.downloadsDir || downloadsDir;
  el.footVersion.textContent = "Watertight " + (s.version || "");
  el.dropzone.querySelector("p").textContent =
    "or click to choose a file — it will be checked, repaired, and saved to " +
    downloadsDir;

  const h = await checkHealth(true);
  // First run with nothing configured: send them straight to Settings.
  if (!settings.baseUrl || (h && h.auth_required && !settings.token)) openSettings();
})();
