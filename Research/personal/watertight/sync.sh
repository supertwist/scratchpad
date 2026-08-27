#!/usr/bin/env bash
# Copy the canonical shared front-end into both places that need it.
# The Electron packager can only bundle files under app/, and the FastAPI
# server serves from server/static, so the shared originals get copied rather
# than symlinked. Run after editing anything in shared/.
set -euo pipefail
cd "$(dirname "$0")"

for dest in server/static app/renderer; do
  mkdir -p "$dest"
  cp shared/watertight.css "$dest/watertight.css"
  cp shared/core.js        "$dest/core.js"
  echo "synced shared/ -> $dest"
done
