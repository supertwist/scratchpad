/* Watertight -- browser front-end.
 *
 * Same shared core as the Electron app; the only difference is how the fixed
 * file reaches disk (an anchor click into the browser's download folder rather
 * than a native write).
 */
"use strict";

const W = window.Watertight;
const $ = (id) => document.getElementById(id);
const TOKEN_KEY = "watertight.token";

let token = localStorage.getItem(TOKEN_KEY) || "";
let lastResult = null;
let busy = false;

// Same origin: the page is served by the very server we call.
const client = new W.Client(() => ({ baseUrl: "", token }));

$("brandIcon").innerHTML = W.svg.drop;
$("dropArrow").innerHTML = W.svg.arrow;
$("savedIcon").innerHTML = W.svg.ok;

const show = (n, v) => n.classList.toggle("hidden", !v);
const setStatus = (state, text) => {
  $("status").dataset.state = state;
  $("statusText").textContent = text;
};

function setBusy(on, what) {
  busy = on;
  $("dropzone").classList.toggle("disabled", on);
  show($("workingCard"), on);
  if (what) $("workingWhat").textContent = what;
}

function clearOutput() {
  $("results").innerHTML = "";
  show($("errorCard"), false);
  show($("savedBanner"), false);
  show($("resultActions"), false);
}

function fail(msg) {
  setBusy(false);
  $("errorText").textContent = msg;
  show($("errorCard"), true);
}

/** Trigger a browser download of the repaired mesh. */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke late so Safari has time to start the transfer.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function handleFile(file) {
  if (busy) return;
  if (!W.looksLikeStl(file)) {
    clearOutput();
    fail(`"${file.name}" is not an .stl file. Watertight only repairs STL meshes.`);
    return;
  }

  clearOutput();
  setBusy(true, `Uploading ${file.name}…`);
  const narrate = setTimeout(
    () => setBusy(true, "Analysing and repairing — large meshes can take a minute…"),
    1200
  );

  try {
    const res = await client.repair(file);
    clearTimeout(narrate);
    lastResult = res;

    $("results").innerHTML = res.report
      ? W.reportHtml(res.report, file.name)
      : '<div class="verdict warn">' + W.svg.warn +
        '<div><div class="title">Repaired, but no report came back</div></div></div>';

    setBusy(false);
    show($("resultActions"), true);

    if (!res.report || res.report.success !== false) {
      download(res.blob, res.filename);
      $("savedPath").textContent = res.filename;
      show($("savedBanner"), true);
    }
  } catch (e) {
    clearTimeout(narrate);
    fail(e && e.message ? e.message : String(e));
  }
}

W.wireDropzone($("dropzone"), $("fileInput"), handleFile);

$("anotherBtn").addEventListener("click", () => { clearOutput(); $("fileInput").click(); });
$("errorRetry").addEventListener("click", () => { clearOutput(); $("fileInput").click(); });
$("downloadAgainBtn").addEventListener("click", () => {
  if (lastResult) download(lastResult.blob, lastResult.filename);
});

$("tokenBtn").addEventListener("click", () => {
  const card = $("tokenCard");
  $("token").value = token;
  show(card, card.classList.contains("hidden"));
});
$("closeToken").addEventListener("click", () => show($("tokenCard"), false));
$("saveToken").addEventListener("click", async () => {
  token = $("token").value.trim();
  localStorage.setItem(TOKEN_KEY, token);
  show($("tokenCard"), false);
  await boot();
});

async function boot() {
  try {
    const h = await client.health();
    $("footInfo").textContent = `v${h.version} · up to ${h.max_upload_mb} MB`;
    // No point showing a token control on a server that does not want one.
    show($("tokenBtn"), h.auth_required);
    if (!h.auth_required) show($("tokenCard"), false);
    if (h.auth_required && !token) {
      setStatus("offline", "Token required");
      show($("tokenCard"), true);
    } else {
      setStatus("ok", "Ready");
    }
  } catch (e) {
    setStatus("offline", "Server unreachable");
  }
}

boot();
