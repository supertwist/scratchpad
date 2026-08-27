/* End-to-end test of the real Watertight app.
 *
 * Requires the production main.js so the actual IPC handlers, settings
 * persistence and file-saving code are what get exercised. Redirects userData
 * and downloads into /tmp so the test cannot touch real settings or the real
 * Downloads folder.
 *
 * Run:  SERVER=http://127.0.0.1:8799 TOKEN=... STL=/path/to.stl \
 *         node_modules/.bin/electron test/e2e-main.js
 */
"use strict";

const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const TMP = "/tmp/wt-e2e";
app.setPath("userData", path.join(TMP, "userdata"));
fs.mkdirSync(path.join(TMP, "downloads"), { recursive: true });
app.setPath("downloads", path.join(TMP, "downloads"));

require("../main.js"); // registers handlers + creates the window

const SERVER = process.env.SERVER;
const TOKEN = process.env.TOKEN || "";
const STL = process.env.STL;

const fail = (msg) => { console.log("FAIL: " + msg); app.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  await sleep(1500);
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return fail("no window was created");
  const wc = win.webContents;

  const b64 = fs.readFileSync(STL).toString("base64");

  // 1. Point the app at the test server through its own settings IPC.
  const saved = await wc.executeJavaScript(`
    (async () => {
      const s = await window.wtNative.setSettings({
        baseUrl: ${JSON.stringify(SERVER)},
        token: ${JSON.stringify(TOKEN)},
        autoSave: true,
        revealAfterSave: false
      });
      settings = s;                     // adopt without a reload
      return s.baseUrl;
    })()
  `);
  if (saved !== SERVER) return fail("settings did not persist (got " + saved + ")");
  console.log("PASS settings persisted via IPC");

  // 2. Health check through the shared client.
  const health = await wc.executeJavaScript(`
    (async () => { try { const h = await client.health(); return h.status; }
                   catch (e) { return "ERR: " + e.message; } })()
  `);
  if (health !== "ok") return fail("health check: " + health);
  console.log("PASS renderer reached the server");

  // 3. Feed a real STL through the same path a drop takes.
  await wc.executeJavaScript(`
    (async () => {
      const bin = atob(${JSON.stringify(b64)});
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      handleFile(new File([buf], "e2e test model.stl", { type: "model/stl" }));
    })()
  `);

  // 4. Wait for the save banner.
  let savedPath = "";
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const st = await wc.executeJavaScript(`(() => ({
      saved:   !document.getElementById("savedBanner").classList.contains("hidden"),
      path:    document.getElementById("savedPath").textContent,
      err:     !document.getElementById("errorCard").classList.contains("hidden"),
      errText: document.getElementById("errorText").textContent,
      results: document.getElementById("results").innerHTML.length,
      verdict: (document.querySelector(".verdict .title")||{}).textContent || "",
      steps:   document.querySelectorAll(".steps li").length,
      metrics: document.querySelectorAll(".metrics .v").length
    }))()`);
    if (st.err) return fail("app reported an error: " + st.errText);
    if (st.saved) {
      savedPath = st.path;
      console.log("PASS results rendered (" + st.results + " bytes, " +
                  st.steps + " steps, " + st.metrics + " metric cells)");
      console.log("PASS verdict: " + st.verdict);
      break;
    }
  }
  if (!savedPath) return fail("no file was saved within 30s");

  // 5. The saved file must exist, be non-trivial, and be named correctly.
  if (!fs.existsSync(savedPath)) return fail("saved path does not exist: " + savedPath);
  const size = fs.statSync(savedPath).size;
  if (size < 1000) return fail("saved file suspiciously small: " + size + " bytes");
  if (!/e2e test model-FIXED\.stl$/.test(savedPath))
    return fail("wrong output filename: " + savedPath);
  console.log("PASS saved " + savedPath + " (" + size.toLocaleString() + " bytes)");

  // 6. Saving twice must not clobber the first file.
  const again = await wc.executeJavaScript(`
    (async () => { const r = await saveResult(false); return document.getElementById("savedPath").textContent; })()
  `);
  if (again === savedPath) return fail("second save overwrote the first file");
  console.log("PASS second save went to " + path.basename(again));

  // 7. Screenshot, so the layout can be eyeballed without launching the app.
  if (process.env.SHOT) {
    const img = await wc.capturePage();
    fs.writeFileSync(process.env.SHOT, img.toPNG());
    console.log("PASS screenshot -> " + process.env.SHOT);
  }

  console.log("ALL E2E CHECKS PASSED");
  app.exit(0);
}).catch((e) => fail("harness threw: " + (e && e.stack)));

setTimeout(() => fail("global timeout"), 60000);
