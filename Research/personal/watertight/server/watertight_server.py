#!/usr/bin/env python3
"""
Watertight -- HTTP service that analyses and repairs STL meshes.

Endpoints
    GET  /                -> the browser UI (static/index.html)
    GET  /api/health      -> liveness + capability probe (no auth)
    POST /api/analyze     -> report on an STL without changing it
    POST /api/repair      -> repair an STL, returns the fixed binary + report

Auth
    If WATERTIGHT_TOKEN is set, every /api/analyze and /api/repair call must
    present it as "Authorization: Bearer <token>" or "?token=<token>".
    Because Tailscale Funnel puts this server on the public internet, the
    service refuses to start with Funnel-style exposure and no token unless
    WATERTIGHT_ALLOW_NO_AUTH=1 is set explicitly.

Configuration (environment variables)
    WATERTIGHT_TOKEN          shared class token; empty disables auth
    WATERTIGHT_MAX_MB         max upload size in MB            (default 50)
    WATERTIGHT_MAX_FACES      refuse meshes above this         (default 5000000)
    WATERTIGHT_WORKERS        concurrent repair jobs           (default 2)
    WATERTIGHT_ALLOW_NO_AUTH  set to 1 to run with no token
    PORT                      listen port                      (default 8765)
"""

from __future__ import annotations

import asyncio
import hmac
import json
import logging
import os
import re
import time
import uuid
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

import mesh_repair

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s  %(message)s",
)
log = logging.getLogger("watertight")

HERE = Path(__file__).resolve().parent
STATIC = HERE / "static"

TOKEN = os.environ.get("WATERTIGHT_TOKEN", "").strip()
MAX_BYTES = int(float(os.environ.get("WATERTIGHT_MAX_MB", "50")) * 1024 * 1024)
MAX_FACES = int(os.environ.get("WATERTIGHT_MAX_FACES", "5000000"))
WORKERS = max(1, int(os.environ.get("WATERTIGHT_WORKERS", "2")))
ALLOW_NO_AUTH = os.environ.get("WATERTIGHT_ALLOW_NO_AUTH", "") == "1"

if not TOKEN and not ALLOW_NO_AUTH:
    raise SystemExit(
        "Refusing to start with no token.\n"
        "Set WATERTIGHT_TOKEN=<secret>, or set WATERTIGHT_ALLOW_NO_AUTH=1 if this "
        "server is genuinely only reachable on a private tailnet."
    )
if not TOKEN:
    log.warning("Running with NO authentication (WATERTIGHT_ALLOW_NO_AUTH=1)")

app = FastAPI(title="Watertight", version="1.0.0", docs_url=None, redoc_url=None)

# The UI is the primary interface and may be served over a public Funnel URL,
# so lock down what the page is allowed to do. 'unsafe-inline' for styles only:
# core.js sets a few inline style attributes when it builds the report.
CSP = (
    "default-src 'none'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "connect-src 'self'; "
    "base-uri 'none'; "
    "form-action 'none'; "
    "frame-ancestors 'none'"
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Content-Security-Policy", CSP)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("X-Frame-Options", "DENY")
    # Uploaded meshes are the student's own work; keep them out of caches.
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response

# CPU-bound repair work runs in separate processes so one huge mesh cannot
# block the event loop and stall every other student's upload.
_pool: ProcessPoolExecutor | None = None
_slots: asyncio.Semaphore | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _pool, _slots
    _pool = ProcessPoolExecutor(max_workers=WORKERS)
    _slots = asyncio.Semaphore(WORKERS)
    log.info(
        "Watertight ready -- workers=%d  max_upload=%dMB  auth=%s  pymeshfix=%s",
        WORKERS, MAX_BYTES // 1024 // 1024,
        "on" if TOKEN else "OFF", mesh_repair.HAVE_PYMESHFIX,
    )


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _pool:
        _pool.shutdown(wait=False, cancel_futures=True)


# ── Auth ──────────────────────────────────────────────────────────────────────

def require_token(request: Request, token: str | None = Query(default=None)) -> None:
    """Constant-time bearer/query token check. No-op when auth is disabled."""
    if not TOKEN:
        return
    supplied = ""
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        supplied = header[7:].strip()
    elif token:
        supplied = token.strip()
    if not supplied or not hmac.compare_digest(supplied, TOKEN):
        raise HTTPException(status_code=401, detail="Invalid or missing access token")


# ── Helpers ───────────────────────────────────────────────────────────────────

_SAFE = re.compile(r"[^A-Za-z0-9._ -]")


def safe_stem(name: str) -> str:
    """Reduce an uploaded filename to a safe stem, dropping any path parts."""
    stem = Path(name or "model").name
    stem = re.sub(r"\.stl$", "", stem, flags=re.IGNORECASE)
    stem = _SAFE.sub("_", stem).strip() or "model"
    return stem[:120]


async def read_upload(f: UploadFile) -> bytes:
    """Stream an upload to memory, enforcing the size cap as we go."""
    chunks, total = [], 0
    while True:
        chunk = await f.read(1 << 20)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_BYTES:
            raise HTTPException(
                413, f"File is larger than the {MAX_BYTES // 1024 // 1024} MB limit"
            )
        chunks.append(chunk)
    if not total:
        raise HTTPException(400, "Uploaded file is empty")
    return b"".join(chunks)


# ── Worker-process entry points ───────────────────────────────────────────────
# These run in the ProcessPoolExecutor, so they must be module-level and take
# only picklable arguments.

def _work_analyze(data: bytes) -> dict:
    mesh = mesh_repair.load_mesh(data)
    if len(mesh.faces) > MAX_FACES:
        raise ValueError(f"mesh has {len(mesh.faces):,} faces, over the "
                         f"{MAX_FACES:,} limit")
    return mesh_repair.analyze(mesh).as_dict()


def _work_repair(data: bytes, drop_debris: bool, allow_rebuild: bool) -> tuple[bytes, dict]:
    mesh = mesh_repair.load_mesh(data)
    if len(mesh.faces) > MAX_FACES:
        raise ValueError(f"mesh has {len(mesh.faces):,} faces, over the "
                         f"{MAX_FACES:,} limit")
    fixed, res = mesh_repair.repair(
        mesh, drop_debris=drop_debris, allow_rebuild=allow_rebuild
    )
    return mesh_repair.export_stl(fixed), res.as_dict()


async def run_job(fn, *args):
    """Run a CPU-bound job in the pool, holding one concurrency slot."""
    assert _pool and _slots
    async with _slots:
        loop = asyncio.get_running_loop()
        try:
            return await loop.run_in_executor(_pool, fn, *args)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except Exception as exc:
            log.exception("job failed")
            raise HTTPException(500, f"Processing failed: {exc}") from exc


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "watertight",
        "version": app.version,
        "auth_required": bool(TOKEN),
        "pymeshfix": mesh_repair.HAVE_PYMESHFIX,
        "max_upload_mb": MAX_BYTES // 1024 // 1024,
        "max_faces": MAX_FACES,
    }


@app.post("/api/analyze", dependencies=[Depends(require_token)])
async def api_analyze(file: UploadFile = File(...)) -> JSONResponse:
    data = await read_upload(file)
    t0 = time.perf_counter()
    report = await run_job(_work_analyze, data)
    log.info("analyze  %-40s %6.2fs  watertight=%s",
             file.filename, time.perf_counter() - t0, report["watertight"])
    return JSONResponse({"filename": file.filename, "analysis": report})


@app.post("/api/repair", dependencies=[Depends(require_token)])
async def api_repair(
    file: UploadFile = File(...),
    drop_debris: bool = Query(default=True),
    allow_rebuild: bool = Query(default=True),
) -> Response:
    """Repair a mesh.

    The fixed STL comes back as the response body; the full report rides along
    in the X-Watertight-Report header (JSON) so the client gets both in one
    round trip without a second upload.
    """
    data = await read_upload(file)
    t0 = time.perf_counter()
    stl, report = await run_job(_work_repair, data, drop_debris, allow_rebuild)
    elapsed = time.perf_counter() - t0
    report["elapsed_seconds"] = round(elapsed, 2)

    out_name = f"{safe_stem(file.filename)}-FIXED.stl"
    log.info("repair   %-40s %6.2fs  success=%s rebuilt=%s -> %s",
             file.filename, elapsed, report["success"], report["rebuilt"], out_name)

    return Response(
        content=stl,
        media_type="model/stl",
        headers={
            "Content-Disposition": f'attachment; filename="{out_name}"',
            "X-Watertight-Report": json.dumps(report, separators=(",", ":")),
            "X-Watertight-Filename": out_name,
            # Let the browser fetch() read our custom headers.
            "Access-Control-Expose-Headers":
                "X-Watertight-Report, X-Watertight-Filename, Content-Disposition",
        },
    )


# The browser UI. Mounted last so it never shadows /api/*.
if STATIC.is_dir():
    @app.get("/")
    async def index() -> FileResponse:
        return FileResponse(STATIC / "index.html")

    app.mount("/static", StaticFiles(directory=STATIC), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8765")),
        log_level="info",
    )
