#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

MODEL_NAME="${MODEL_NAME:-large-v3-turbo}"
MODEL_PATH="models/ggml-${MODEL_NAME}.bin"
MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODEL_NAME}.bin"

command -v brew >/dev/null || { echo "Homebrew required: https://brew.sh"; exit 1; }

echo "==> Checking dependencies"
command -v ffmpeg      >/dev/null || brew install ffmpeg
command -v whisper-cli >/dev/null || brew install whisper-cpp
command -v node        >/dev/null || brew install node

echo "==> Installing npm packages"
npm install --silent

if [ -f "$MODEL_PATH" ]; then
  echo "==> Model already present: $MODEL_PATH"
else
  echo "==> Downloading model $MODEL_NAME (this is a large file)"
  mkdir -p models
  curl -L --fail --progress-bar -o "${MODEL_PATH}.part" "$MODEL_URL"
  mv "${MODEL_PATH}.part" "$MODEL_PATH"
fi

echo
echo "Done. Start the app with:  npm start"
