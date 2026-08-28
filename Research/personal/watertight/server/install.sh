#!/usr/bin/env bash
#
# Watertight server installer for the Mac mini.
#
# Creates a Python virtualenv, installs dependencies, generates an access
# token, and registers a launchd agent so the service starts at login and
# restarts if it crashes.
#
# Usage:   ./install.sh [--token TOKEN | --no-auth] [--port 8765] [--workers N]
#
# Safe to re-run: it will stop the existing service, update it, and restart.

set -euo pipefail

APPDIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$APPDIR/.venv"
LABEL="edu.gwu.corcoran.watertight"
PLIST_SRC="$APPDIR/$LABEL.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOGDIR="$HOME/Library/Logs/Watertight"

PORT=8765
TOKEN=""
WORKERS=""
NO_AUTH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)   TOKEN="$2"; shift 2 ;;
    --no-auth) NO_AUTH=1; shift ;;
    --port)    PORT="$2"; shift 2 ;;
    --workers) WORKERS="$2"; shift 2 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

echo "==> Watertight installer"
echo "    app dir : $APPDIR"

# ── Python ────────────────────────────────────────────────────────────────────
# We need >= 3.10: numpy 2.x and scipy require it, and FastAPI evaluates
# "str | None" annotations at runtime, which 3.9 cannot parse. macOS ships
# 3.9.6, so on a stock machine we fetch a private interpreter with uv rather
# than touching the system Python or requiring an admin password for Homebrew.
PY=""
for c in python3.13 python3.12 python3.11 python3.10 python3; do
  cand="$(command -v "$c" 2>/dev/null || true)"
  [[ -z "$cand" ]] && continue
  if "$cand" -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
    PY="$cand"; break
  fi
done

USE_UV=""
if [[ -n "$PY" ]]; then
  echo "    python  : $PY ($("$PY" --version 2>&1))"
else
  SYS_PY_VER="$(python3 --version 2>&1 || echo 'none')"
  echo "    python  : $SYS_PY_VER is too old (need >= 3.10)"
  UV="$(command -v uv || true)"
  [[ -z "$UV" && -x "$HOME/.local/bin/uv" ]] && UV="$HOME/.local/bin/uv"
  if [[ -z "$UV" ]]; then
    echo "==> Installing uv (user-local, no sudo) to fetch Python 3.12"
    curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null 2>&1 || {
      echo "!! Could not install uv. Install Python 3.10+ manually, then re-run." >&2
      exit 1
    }
    UV="$HOME/.local/bin/uv"
  fi
  [[ -x "$UV" ]] || { echo "!! uv not usable at $UV" >&2; exit 1; }
  echo "    uv      : $("$UV" --version 2>&1)"
  USE_UV="$UV"
fi

# Size the worker pool against BOTH cores and RAM. Each worker can hold a whole
# mesh plus PyMeshFix's working copies, so on a small-memory machine the core
# count alone would oversubscribe and push the box into swap.
if [[ -z "$WORKERS" ]]; then
  CORES="$(sysctl -n hw.ncpu 2>/dev/null || echo 4)"
  RAM_GB=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 8589934592) / 1073741824 ))
  W_CORES=$(( CORES > 4 ? CORES - 2 : 2 ))
  W_RAM=$(( RAM_GB / 4 ))
  WORKERS=$(( W_CORES < W_RAM ? W_CORES : W_RAM ))
  (( WORKERS < 1 )) && WORKERS=1
  (( WORKERS > 4 )) && WORKERS=4
  echo "    workers : $WORKERS  (${CORES} cores, ${RAM_GB} GB RAM)"
  # Cap uploads on small-memory machines so one huge mesh cannot exhaust RAM.
  if (( RAM_GB <= 8 )) && [[ -z "${MAX_MB:-}" ]]; then MAX_MB=150; fi
else
  echo "    workers : $WORKERS (specified)"
fi
MAX_MB="${MAX_MB:-200}"
echo "    max upload: ${MAX_MB} MB"

# ── Virtualenv ────────────────────────────────────────────────────────────────
if [[ -n "$USE_UV" ]]; then
  if [[ ! -x "$VENV/bin/python" ]]; then
    echo "==> Creating virtualenv with a private Python 3.12 (downloads once)"
    "$USE_UV" venv --python 3.12 "$VENV"
  fi
  echo "==> Installing dependencies"
  "$USE_UV" pip install --python "$VENV/bin/python" -r "$APPDIR/requirements.txt"
else
  if [[ ! -d "$VENV" ]]; then
    echo "==> Creating virtualenv"
    "$PY" -m venv "$VENV"
  fi
  echo "==> Installing dependencies (this takes a minute)"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet -r "$APPDIR/requirements.txt"
fi

echo "    venv python: $("$VENV/bin/python" --version 2>&1)"

echo "==> Verifying the repair engine"
"$VENV/bin/python" - <<'PYCHECK'
import sys
import trimesh, numpy, pymeshfix, networkx, scipy, fastapi   # noqa: F401
sys.path.insert(0, ".")
import mesh_repair as mr

# End-to-end smoke test: break a sphere, repair it, confirm it closed.
s = trimesh.creation.icosphere(subdivisions=2, radius=10)
s.update_faces(s.triangles_center[:, 2] < 6)
mesh = mr.load_mesh(trimesh.exchange.stl.export_stl(s))
fixed, res = mr.repair(mesh)
assert res.success, "self-test failed: repaired mesh is not watertight"
print("    engine OK (pymeshfix %s, trimesh %s)" % (pymeshfix.__version__, trimesh.__version__))
PYCHECK

# ── Token ─────────────────────────────────────────────────────────────────────
TOKENFILE="$APPDIR/.token"
if [[ -n "$NO_AUTH" ]]; then
  TOKEN=""
  rm -f "$TOKENFILE"
  echo "==> Running with NO access token (--no-auth)"
elif [[ -z "$TOKEN" ]]; then
  if [[ -f "$TOKENFILE" ]]; then
    TOKEN="$(cat "$TOKENFILE")"
    echo "==> Reusing the existing access token"
  else
    TOKEN="$("$VENV/bin/python" -c 'import secrets;print(secrets.token_urlsafe(18))')"
    echo "==> Generated a new access token"
  fi
fi
if [[ -z "$NO_AUTH" ]]; then
  printf '%s' "$TOKEN" > "$TOKENFILE"
  chmod 600 "$TOKENFILE"
fi

# ── launchd ───────────────────────────────────────────────────────────────────
mkdir -p "$LOGDIR" "$HOME/Library/LaunchAgents"

echo "==> Writing $PLIST_DST"
sed -e "s|__VENV__|$VENV|g" \
    -e "s|__APPDIR__|$APPDIR|g" \
    -e "s|__LOGDIR__|$LOGDIR|g" \
    -e "s|__TOKEN__|$TOKEN|g" \
    -e "s|__WORKERS__|$WORKERS|g" \
    "$PLIST_SRC" > "$PLIST_DST"

# Port is templated separately so --port works.
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:PORT $PORT" "$PLIST_DST" >/dev/null
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:WATERTIGHT_MAX_MB $MAX_MB" "$PLIST_DST" >/dev/null
if [[ -n "$NO_AUTH" ]]; then
  /usr/libexec/PlistBuddy \
    -c "Set :EnvironmentVariables:WATERTIGHT_TOKEN " \
    -c "Add :EnvironmentVariables:WATERTIGHT_ALLOW_NO_AUTH string 1" \
    "$PLIST_DST" >/dev/null
fi

UID_NUM="$(id -u)"
echo "==> Restarting the service"
launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_NUM" "$PLIST_DST"
launchctl enable "gui/$UID_NUM/$LABEL" 2>/dev/null || true

# ── Verify ────────────────────────────────────────────────────────────────────
echo "==> Waiting for the service to answer"
OK=""
for _ in $(seq 1 25); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then OK=1; break; fi
  sleep 1
done

TS_IP="$(/usr/bin/env PATH="/Applications/Tailscale.app/Contents/MacOS:$PATH" \
         tailscale ip -4 2>/dev/null | head -1 || true)"

echo
if [[ -n "$OK" ]]; then
  echo "  Watertight is running."
else
  echo "  The service did not answer in time. Check the log:"
  echo "     tail -n 40 $LOGDIR/watertight.error.log"
fi
echo
if [[ -n "$NO_AUTH" ]]; then
  echo "  Access token : none - anyone who can reach the address can use it"
else
  echo "  Access token : $TOKEN"
fi
echo "  Local        : http://127.0.0.1:$PORT"
[[ -n "$TS_IP" ]] && echo "  Tailnet      : http://$TS_IP:$PORT"
echo "  Logs         : $LOGDIR/watertight.log"
echo
if [[ -n "$NO_AUTH" ]]; then
  echo "  Give students the address above - they just open it in a browser."
else
  echo "  Give students the address and the token above."
fi
echo "  To expose it off-tailnet, see MINI-SETUP.md (Tailscale Funnel)."
