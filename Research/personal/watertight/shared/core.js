/* Watertight -- shared front-end core.
 *
 * Platform-agnostic: knows how to talk to the API and how to render a report,
 * but nothing about how the fixed file gets saved. The host page supplies a
 * `save` function, keeping this file free of any download mechanics.
 *
 * Canonical copy lives in /shared; sync.sh copies it. Edit it here.
 */
(function (global) {
  "use strict";

  const svg = {
    drop: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7c3.2 3.6 5.6 6.7 5.6 9.4a5.6 5.6 0 0 1-11.2 0c0-2.7 2.4-5.8 5.6-9.4z"/></svg>',
    arrow: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m6.5 9.5 5.5 6.5 5.5-6.5"/><path d="M4 19.5h16"/></svg>',
    ok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><path d="m8 12.4 2.7 2.7L16 9.6"/></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 2.8 20h18.4z"/><path d="M12 10v4.2"/><path d="M12 17.4h.01"/></svg>',
    bad: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    tick: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
    dash: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 12h12"/></svg>',
    cross: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const n = (v) => (typeof v === "number" ? v.toLocaleString() : String(v ?? "--"));

  function fixedName(original) {
    const base = String(original || "model").replace(/\.stl$/i, "");
    return base + "-FIXED.stl";
  }

  /* ── API client ───────────────────────────────────────────────────────── */

  class Client {
    constructor(getConfig) {
      this.getConfig = getConfig; // () => ({ baseUrl, token })
    }

    _url(path) {
      const { baseUrl } = this.getConfig();
      const base = String(baseUrl || "").replace(/\/+$/, "");
      return base + path;
    }

    _headers() {
      const { token } = this.getConfig();
      return token ? { Authorization: "Bearer " + token } : {};
    }

    async health(timeoutMs = 6000) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const r = await fetch(this._url("/api/health"), { signal: ctl.signal });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
      } finally {
        clearTimeout(t);
      }
    }

    /** Repair a file. Returns { blob, report, filename }. */
    async repair(file, opts = {}) {
      const fd = new FormData();
      fd.append("file", file, file.name);

      const qs = new URLSearchParams({
        drop_debris: String(opts.dropDebris !== false),
        allow_rebuild: String(opts.allowRebuild !== false),
      });

      const r = await fetch(this._url("/api/repair?" + qs), {
        method: "POST",
        headers: this._headers(),
        body: fd,
        signal: opts.signal,
      });

      if (!r.ok) throw new Error(await describeError(r));

      let report = null;
      try {
        report = JSON.parse(r.headers.get("X-Watertight-Report") || "null");
      } catch (_) {
        /* report is a nicety; the file matters more */
      }

      return {
        blob: await r.blob(),
        report,
        filename: r.headers.get("X-Watertight-Filename") || fixedName(file.name),
      };
    }
  }

  async function describeError(r) {
    let msg = "";
    try {
      const j = await r.json();
      msg = j.detail || j.message || "";
    } catch (_) {
      try { msg = (await r.text()).slice(0, 300); } catch (_) {}
    }
    if (r.status === 401) return msg || "Access token rejected. Check Settings.";
    if (r.status === 413) return msg || "That file is too large for the server.";
    if (r.status === 422) return msg || "That file could not be read as an STL.";
    return msg || "Server error " + r.status;
  }

  /* ── Rendering ────────────────────────────────────────────────────────── */

  /** The before/after metric table. */
  function metricsHtml(before, after) {
    const rows = [
      ["Triangles", "faces", false],
      ["Vertices", "vertices", false],
      ["Watertight", "watertight", true],
      ["Holes", "boundary_loops", true],
      ["Naked edges", "naked_edges", true],
      ["Non-manifold edges", "non_manifold_edges", true],
      ["Degenerate faces", "degenerate_faces", true],
      ["Duplicate faces", "duplicate_faces", true],
      ["Separate shells", "shells", false],
      ["Normals consistent", "winding_consistent", true],
      ["Inside-out", "inverted", true],
    ];

    // Render a value, colouring it by whether it is a defect.
    const cell = (a, key, judge) => {
      if (!a) return '<div class="v dim">--</div>';
      const raw = a[key];
      if (raw === null || raw === undefined) return '<div class="v dim">--</div>';

      let txt, cls = "";
      if (typeof raw === "boolean") {
        txt = raw ? "yes" : "no";
        if (judge) {
          const wantTrue = key === "watertight" || key === "winding_consistent";
          const good = wantTrue ? raw : !raw;
          cls = good ? "good" : "bad";
        }
      } else {
        txt = n(raw);
        if (judge) cls = raw === 0 ? "good" : "bad";
      }
      return `<div class="v ${cls}">${esc(txt)}</div>`;
    };

    let html =
      '<div class="metrics">' +
      '<div class="head"></div><div class="head num">Before</div><div class="head num">After</div>';

    rows.forEach(([label, key, judge], i) => {
      const last = i === rows.length - 1 ? " row-last" : "";
      html +=
        `<div class="k${last}">${esc(label)}</div>` +
        cell(before, key, judge).replace('class="v', `class="v${last}`) +
        cell(after, key, judge).replace('class="v', `class="v${last}`);
    });

    return html + "</div>";
  }

  function stepsHtml(steps) {
    if (!steps || !steps.length) return "";
    return (
      '<ul class="steps">' +
      steps
        .map((s) => {
          const failed = /^failed/i.test(s.detail || "");
          const mark = s.applied
            ? `<span class="mark did">${svg.tick}</span>`
            : failed
            ? `<span class="mark fail">${svg.cross}</span>`
            : `<span class="mark skip">${svg.dash}</span>`;
          const delta =
            s.applied && s.faces_after !== s.faces_before
              ? ` <span class="detail">(${n(s.faces_before)} -> ${n(s.faces_after)} triangles)</span>`
              : "";
          return (
            `<li class="${s.applied ? "" : "inactive"}">${mark}<div>` +
            `<div class="label">${esc(s.label)}</div>` +
            `<div class="detail">${esc(s.detail)}${delta ? "" : ""}</div>${delta}` +
            `</div></li>`
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function notesHtml(warnings) {
    if (!warnings || !warnings.length) return "";
    return (
      '<ul class="notes">' +
      warnings.map((w) => `<li>${svg.warn}<span>${esc(w)}</span></li>`).join("") +
      "</ul>"
    );
  }

  function verdictHtml(report) {
    const b = report.before || {};
    const a = report.after || {};

    if (report.success) {
      const wasFine = b.printable;
      const title = wasFine
        ? "Already watertight -- nothing needed fixing"
        : report.rebuilt
        ? "Watertight, but the mesh had to be rebuilt"
        : "Watertight and ready to print";
      const sub = wasFine
        ? "Your file was already print-ready. The saved copy is normalised but geometrically unchanged."
        : report.rebuilt
        ? "The damage was too extensive for a light repair. Check the result against your original before printing."
        : "Fixed without rebuilding the mesh, so your surface detail is preserved.";
      return `<div class="verdict ${report.rebuilt ? "warn" : "ok"}">${
        report.rebuilt ? svg.warn : svg.ok
      }<div><div class="title">${esc(title)}</div><div class="sub">${esc(sub)}</div></div></div>`;
    }

    const left = [];
    if (a.naked_edges) left.push(`${n(a.naked_edges)} naked edges`);
    if (a.non_manifold_edges) left.push(`${n(a.non_manifold_edges)} non-manifold edges`);
    if (a.boundary_loops) left.push(`${n(a.boundary_loops)} hole(s)`);
    return (
      `<div class="verdict bad">${svg.bad}<div>` +
      `<div class="title">Could not make this watertight</div>` +
      `<div class="sub">Still open: ${esc(left.join(", ") || "unresolved topology")}. ` +
      `This model needs manual attention before printing.</div></div></div>`
    );
  }

  /** Build the whole result card. */
  function reportHtml(report, originalName) {
    return (
      verdictHtml(report) +
      '<div class="card" style="margin-top:14px">' +
      `<h3>Analysis <span class="file">${esc(originalName)}</span></h3>` +
      `<div class="body">${metricsHtml(report.before, report.after)}</div>` +
      "</div>" +
      '<div class="card" style="margin-top:14px">' +
      "<h3>What was done</h3>" +
      `<div class="body">${stepsHtml(report.steps)}</div>` +
      "</div>" +
      (report.warnings && report.warnings.length
        ? '<div style="margin-top:14px">' + notesHtml(report.warnings) + "</div>"
        : "")
    );
  }

  /* ── Dropzone wiring ─────────────────────────────────────────────────── */

  /** Attach drag/drop + click-to-browse. Calls onFile(File). */
  function wireDropzone(el, input, onFile) {
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

    ["dragenter", "dragover"].forEach((ev) =>
      el.addEventListener(ev, (e) => { stop(e); el.classList.add("hot"); })
    );
    ["dragleave", "drop"].forEach((ev) =>
      el.addEventListener(ev, (e) => { stop(e); el.classList.remove("hot"); })
    );

    el.addEventListener("drop", (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) onFile(f);
    });

    el.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      if (input.files && input.files[0]) onFile(input.files[0]);
      input.value = ""; // let the same file be picked twice in a row
    });

    // The window-level handlers stop the browser from navigating away to the
    // dropped file when the user misses the dropzone.
    ["dragover", "drop"].forEach((ev) =>
      window.addEventListener(ev, (e) => e.preventDefault())
    );
  }

  function looksLikeStl(file) {
    return /\.stl$/i.test(file.name || "");
  }

  global.Watertight = {
    Client, svg, esc, n, fixedName,
    reportHtml, metricsHtml, stepsHtml, notesHtml, verdictHtml,
    wireDropzone, looksLikeStl,
  };
})(window);
