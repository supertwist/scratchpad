/* End-to-end test of the *served web page* in a real Chromium.
 *
 * Loads the page the way a student's browser would, drops an STL into it via
 * a synthetic DragEvent, and captures the resulting download through Electron's
 * download manager. This exercises the browser path (blob + anchor click),
 * which the Electron app does not use.
 *
 * Run:  SERVER=http://127.0.0.1:8799 STL=/path/model.stl \
 *         node_modules/.bin/electron test/web-e2e.js
 */
"use strict";

const { app, BrowserWindow, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const SERVER = process.env.SERVER;
const STL = process.env.STL;
const DL = "/tmp/wt-web-dl";
const WIDTH = parseInt(process.env.WIDTH || "1100", 10);

fs.rmSync(DL, { recursive: true, force: true });
fs.mkdirSync(DL, { recursive: true });
app.setPath("userData", "/tmp/wt-web-userdata");

const fail = (m) => { console.log("FAIL: " + m); app.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let downloaded = null;

app.whenReady().then(async () => {
  // Capture downloads the way a browser would, into a temp folder.
  session.defaultSession.on("will-download", (_e, item) => {
    const target = path.join(DL, item.getFilename());
    item.setSavePath(target);
    item.once("done", (_ev, state) => {
      if (state === "completed") downloaded = target;
      else fail("download did not complete: " + state);
    });
  });

  const win = new BrowserWindow({ width: WIDTH, height: 1000, show: false });
  const wc = win.webContents;

  const errors = [];
  wc.on("console-message", (_e, level, msg) => {
    if (level >= 2) errors.push(msg);           // warnings and errors
  });

  await wc.loadURL(SERVER + "/");
  await sleep(1200);

  // 1. Page loaded, shared core present, status resolved.
  const boot = await wc.executeJavaScript(`({
    title: document.title,
    hasCore: typeof window.Watertight === "object",
    status: document.getElementById("statusText").textContent,
    state: document.getElementById("status").dataset.state,
    tokenCardShown: !document.getElementById("tokenCard").classList.contains("hidden"),
    foot: document.getElementById("footInfo").textContent
  })`);
  if (!boot.hasCore) return fail("shared core.js did not load in the browser");
  if (boot.state !== "ok") return fail("status was '" + boot.status + "' (expected ready)");
  console.log("PASS page booted: " + JSON.stringify(boot));

  // 2. Drop a real STL using a synthetic DragEvent with a DataTransfer,
  //    which is what actually happens when a student drags a file in.
  const b64 = fs.readFileSync(STL).toString("base64");
  await wc.executeJavaScript(`
    (() => {
      const bin = atob(${JSON.stringify(b64)});
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const file = new File([buf], "web drop test.stl", { type: "model/stl" });
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById("dropzone")
        .dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
      return true;
    })()
  `);

  // 3. Wait for the report and the download banner.
  let st = null;
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    st = await wc.executeJavaScript(`({
      saved:   !document.getElementById("savedBanner").classList.contains("hidden"),
      name:    document.getElementById("savedPath").textContent,
      err:     !document.getElementById("errorCard").classList.contains("hidden"),
      errText: document.getElementById("errorText").textContent,
      verdict: (document.querySelector(".verdict .title")||{}).textContent || "",
      steps:   document.querySelectorAll(".steps li").length,
      metrics: document.querySelectorAll(".metrics .v").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth
    })`);
    if (st.err) return fail("page reported: " + st.errText);
    if (st.saved) break;
  }
  if (!st || !st.saved) return fail("no download banner appeared within 30s");
  console.log("PASS drop handled: verdict=\"" + st.verdict + "\" steps=" +
              st.steps + " metrics=" + st.metrics);

  if (st.name !== "web drop test-FIXED.stl")
    return fail("wrong download name: " + st.name);
  console.log("PASS download named correctly: " + st.name);

  // 4. The browser actually wrote the file.
  for (let i = 0; i < 20 && !downloaded; i++) await sleep(300);
  if (!downloaded) return fail("browser never triggered a download");
  const size = fs.statSync(downloaded).size;
  if (size < 1000) return fail("downloaded file too small: " + size);
  console.log("PASS browser downloaded " + path.basename(downloaded) +
              " (" + size.toLocaleString() + " bytes)");

  // 5. Layout must not overflow horizontally at this width.
  if (st.overflow) return fail("page overflows horizontally at " + WIDTH + "px");
  console.log("PASS no horizontal overflow at " + WIDTH + "px");

  const real = errors.filter((m) => !/favicon|DevTools/i.test(m));
  if (real.length) return fail("console errors: " + real.join(" | "));
  console.log("PASS no console errors");

  if (process.env.SHOT) {
    fs.writeFileSync(process.env.SHOT, (await wc.capturePage()).toPNG());
    console.log("PASS screenshot -> " + process.env.SHOT);
  }

  console.log("ALL WEB E2E CHECKS PASSED");
  app.exit(0);
}).catch((e) => fail("harness threw: " + (e && e.stack)));

setTimeout(() => fail("global timeout"), 60000);
