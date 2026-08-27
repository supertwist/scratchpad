/* Watertight -- preload bridge.
 *
 * The renderer gets exactly these calls and nothing else: no fs, no require,
 * no arbitrary paths. Every filesystem decision stays in the main process.
 */
"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wtNative", {
  isElectron: true,

  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (next) => ipcRenderer.invoke("settings:set", next),

  /** bytes: Uint8Array. Returns { canceled } | { path, filename }. */
  saveFile: (filename, bytes, saveAs = false) =>
    ipcRenderer.invoke("file:save", { filename, bytes, saveAs }),

  reveal: (p) => ipcRenderer.invoke("file:reveal", p),
  openStlDialog: () => ipcRenderer.invoke("dialog:openStl"),
  openExternal: (url) => ipcRenderer.invoke("shell:open", url),

  /** Menu-driven events. */
  onOpenSettings: (cb) => ipcRenderer.on("open-settings", () => cb()),
  onOpenFileDialog: (cb) => ipcRenderer.on("open-file-dialog", () => cb()),
});
