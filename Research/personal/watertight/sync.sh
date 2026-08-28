#!/usr/bin/env bash
# Copy the canonical shared front-end into the place that serves it.
# FastAPI serves from server/static, so the shared originals get copied rather
# than symlinked. Run after editing anything in shared/.
set -euo pipefail
cd "$(dirname "$0")"

dest=server/static
mkdir -p "$dest"
cp shared/watertight.css "$dest/watertight.css"
cp shared/core.js        "$dest/core.js"
echo "synced shared/ -> $dest"
