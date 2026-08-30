import express from 'express';
import multer from 'multer';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

const ROOT = import.meta.dirname;
const TMP = path.join(ROOT, 'tmp');
const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.WHISPER_MODEL || path.join(ROOT, 'models', 'ggml-large-v3-turbo.bin');
const THREADS = process.env.WHISPER_THREADS || String(Math.max(1, os.cpus().length - 2));

// ffmpeg handles far more than AIFF, so accept the common audio containers too.
const ALLOWED = new Set([
  '.aif', '.aiff', '.aifc',
  '.wav', '.mp3', '.m4a', '.mp4', '.flac', '.ogg', '.opus', '.caf', '.wma',
]);

/** Locate the whisper.cpp CLI. Homebrew installs it as `whisper-cli`. */
async function resolveWhisperBin() {
  if (process.env.WHISPER_BIN) return process.env.WHISPER_BIN;
  for (const name of ['whisper-cli', 'whisper-cpp', 'whisper']) {
    try {
      const { stdout } = await execFileAsync('which', [name]);
      if (stdout.trim()) return stdout.trim();
    } catch { /* not on PATH, try the next one */ }
  }
  throw new Error('whisper.cpp CLI not found on PATH. Run: brew install whisper-cpp');
}

const WHISPER_BIN = await resolveWhisperBin();
await fs.access(MODEL).catch(() => {
  throw new Error(`Model not found at ${MODEL}. Run ./setup.sh to download it.`);
});
console.log(`whisper binary: ${WHISPER_BIN}`);
console.log(`model:          ${MODEL}`);

await fs.mkdir(TMP, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: TMP,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error(`Unsupported file type: ${ext || '(none)'}`));
    cb(null, true);
  },
});

const app = express();
app.use(express.static(path.join(ROOT, 'public')));

app.post('/api/transcribe', (req, res) => {
  upload.single('audio')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const source = req.file.path;
    const base = source.replace(/\.[^.]+$/, '');
    const wav = `${base}.16k.wav`;
    const txt = `${base}.txt`;
    const cleanup = () => Promise.all(
      [source, wav, txt].map((f) => fs.rm(f, { force: true }).catch(() => {})),
    );

    try {
      // whisper.cpp only reads 16 kHz mono 16-bit PCM WAV.
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-nostdin',
        '-i', source,
        '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le',
        '-y', wav,
      ], { maxBuffer: 1024 * 1024 });

      await execFileAsync(WHISPER_BIN, [
        '-m', MODEL,
        '-f', wav,
        '-t', THREADS,
        '-otxt',
        '-of', base,
        '--no-prints',
      ], { maxBuffer: 64 * 1024 * 1024 });

      const text = await fs.readFile(txt, 'utf8');
      const outName = path.basename(req.file.originalname).replace(/\.[^.]+$/, '') + '.txt';

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${outName.replace(/"/g, '')}"`);
      res.send(text.trim() + '\n');
    } catch (err) {
      // Replace internal temp paths with the name the user actually dropped.
      const detail = (err.stderr || err.message || String(err))
        .toString()
        .replaceAll(base, path.basename(req.file.originalname, path.extname(req.file.originalname)))
        .replaceAll(TMP + path.sep, '')
        .trim()
        .slice(-2000);
      console.error(`transcription failed for ${req.file.originalname}:`, detail);
      res.status(500).json({ error: detail });
    } finally {
      await cleanup();
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n  Speech → text ready at http://localhost:${PORT}\n`);
});
// Long files legitimately take many minutes; don't let the socket time out.
server.requestTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0;
