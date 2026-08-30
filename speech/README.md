# Speech → Text

A local web app that turns dropped audio files into `.txt` transcripts using
[whisper.cpp](https://github.com/ggml-org/whisper.cpp). Nothing leaves your machine.

## Setup

```bash
./setup.sh
```

This installs `ffmpeg`, `whisper-cpp`, and the npm packages, then downloads the
`large-v3-turbo` model (~1.6 GB) into `models/`.

## Run

```bash
npm start
```

Open <http://localhost:3000>, drop in `.AIF` files, and the transcript downloads
to your Downloads folder as `<original-name>.txt`.

Files are processed one at a time — Whisper already uses every core, so running
them in parallel would only make each one slower.

## How it works

1. The file is uploaded to `tmp/`.
2. `ffmpeg` converts it to 16 kHz mono 16-bit PCM WAV (the only format whisper.cpp reads).
3. `whisper-cli` transcribes it with `-otxt`.
4. The `.txt` is streamed back as a download and all temp files are deleted.

## Configuration

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `WHISPER_MODEL` | `models/ggml-large-v3-turbo.bin` | Path to a `.bin` model |
| `WHISPER_BIN` | first of `whisper-cli`/`whisper-cpp`/`whisper` on `PATH` | CLI binary |
| `WHISPER_THREADS` | CPU count − 2 | Threads passed to `-t` |

To use a smaller/faster model:

```bash
MODEL_NAME=base.en ./setup.sh
WHISPER_MODEL=models/ggml-base.en.bin npm start
```

## Supported input

`.aif` `.aiff` `.aifc` `.wav` `.mp3` `.m4a` `.mp4` `.flac` `.ogg` `.opus` `.caf` `.wma`
(anything ffmpeg can decode; the UI advertises AIF). Max upload 2 GB.
