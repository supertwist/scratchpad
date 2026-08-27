/* Watertight -- Electron main process (macOS).
 *
 * Owns the window, the persisted settings, and all filesystem writes. The
 * renderer never gets Node access; it asks for a save over IPC and the main
 * process decides where bytes may land.
 */
"use strict";

const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

// app.getVersion() reports Electron's own version when the app is run
// unpackaged, so read our manifest directly and stay correct in both cases.
const APP_VERSION = (() => {
  try {
    return require("./package.json").version;
  } catch (_) {
    return app.getVersion();
  }
})();

// Where the server lives by default. On a private tailnet the Mac mini's
// Tailscale IP works as-is; switch this to the https://<host>.ts.net Funnel
// URL in Settings once Funnel is enabled.
const DEFAULT_SETTINGS = {
  baseUrl: "http://100.105.251.86:8765",
  token: "",
  autoSave: true,
  revealAfterSave: false,
};

let win = null;
let settings = { ...DEFAULT_SETTINGS };

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

async function loadSettings() {
  try {
    const raw = await fs.readFile(settingsPath(), "utf8");
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (_) {
    settings = { ...DEFAULT_SETTINGS }; // first run, or unreadable file
  }
  return settings;
}

async function saveSettings(next) {
  settings = { ...settings, ...next };
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), "utf8");
  return settings;
}

/** Never silently clobber an existing file: bunny-FIXED.stl -> bunny-FIXED-2.stl */
async function uniquePath(dir, filename) {
  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);
  for (let i = 1; i < 1000; i++) {
    const candidate = path.join(dir, i === 1 ? filename : `${stem}-${i}${ext}`);
    try {
      await fs.access(candidate);
    } catch {
      return candidate; // does not exist -- take it
    }
  }
  return path.join(dir, `${stem}-${Date.now()}${ext}`);
}

/** Reject anything that is not a plain .stl basename. */
function sanitizeName(name) {
  const base = path.basename(String(name || "model-FIXED.stl"));
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "_");
  return /\.stl$/i.test(cleaned) ? cleaned : cleaned + ".stl";
}

function createWindow() {
  win = new BrowserWindow({
    width: 720,
    height: 860,
    minWidth: 560,
    minHeight: 620,
    show: false,
    title: "Watertight",
    titleBarStyle: "hiddenInset", // native traffic lights over our own header
    backgroundColor: "#f7f8fa",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.once("ready-to-show", () => win.show());

  // Anything that tries to open a new window goes to the real browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "Cmd+,",
          click: () => win && win.webContents.send("open-settings"),
        },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "Open STL…",
          accelerator: "Cmd+O",
          click: () => win && win.webContents.send("open-file-dialog"),
        },
        { type: "separator" },
        { role: "close" },
      ],
    },
    { label: "Edit", submenu: [{ role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "window", submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "front" }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ── IPC ───────────────────────────────────────────────────────────────── */

ipcMain.handle("settings:get", async () => ({
  ...(await loadSettings()),
  downloadsDir: app.getPath("downloads"),
  version: APP_VERSION,
}));

ipcMain.handle("settings:set", async (_e, next) => {
  const clean = {};
  if (typeof next.baseUrl === "string") clean.baseUrl = next.baseUrl.trim();
  if (typeof next.token === "string") clean.token = next.token.trim();
  if (typeof next.autoSave === "boolean") clean.autoSave = next.autoSave;
  if (typeof next.revealAfterSave === "boolean") clean.revealAfterSave = next.revealAfterSave;
  return await saveSettings(clean);
});

/**
 * Save the repaired STL. `bytes` arrives as a Uint8Array over the structured
 * clone bridge. Writes into the user's Downloads folder unless `saveAs` is
 * set, in which case we show a native sheet.
 */
ipcMain.handle("file:save", async (_e, { filename, bytes, saveAs }) => {
  const name = sanitizeName(filename);
  const buf = Buffer.from(bytes);

  let target;
  if (saveAs) {
    const res = await dialog.showSaveDialog(win, {
      title: "Save repaired STL",
      defaultPath: path.join(app.getPath("downloads"), name),
      filters: [{ name: "STL mesh", extensions: ["stl"] }],
    });
    if (res.canceled || !res.filePath) return { canceled: true };
    target = res.filePath;
  } else {
    const dir = app.getPath("downloads");
    await fs.mkdir(dir, { recursive: true });
    target = await uniquePath(dir, name);
  }

  await fs.writeFile(target, buf);
  if (settings.revealAfterSave) shell.showItemInFolder(target);
  return { canceled: false, path: target, filename: path.basename(target) };
});

ipcMain.handle("file:reveal", async (_e, p) => {
  if (typeof p === "string" && p) shell.showItemInFolder(p);
});

ipcMain.handle("dialog:openStl", async () => {
  const res = await dialog.showOpenDialog(win, {
    title: "Choose an STL",
    properties: ["openFile"],
    filters: [{ name: "STL mesh", extensions: ["stl"] }],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const p = res.filePaths[0];
  const bytes = await fs.readFile(p);
  return { name: path.basename(p), bytes: new Uint8Array(bytes) };
});

ipcMain.handle("shell:open", async (_e, url) => {
  if (/^https?:\/\//.test(String(url))) await shell.openExternal(url);
});

/* ── Lifecycle ─────────────────────────────────────────────────────────── */

app.whenReady().then(async () => {
  await loadSettings();
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
