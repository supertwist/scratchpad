const drop = document.getElementById('drop');
const picker = document.getElementById('picker');
const queueEl = document.getElementById('queue');

const ALLOWED = ['.aif', '.aiff', '.aifc', '.wav', '.mp3', '.m4a', '.mp4', '.flac', '.ogg', '.opus', '.caf'];

// One file at a time: whisper saturates the machine, so parallel runs only slow it down.
const pending = [];
let running = false;

drop.addEventListener('click', () => picker.click());
drop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click(); }
});
picker.addEventListener('change', () => {
  enqueue([...picker.files]);
  picker.value = '';
});

for (const type of ['dragenter', 'dragover']) {
  drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('over'); });
}
for (const type of ['dragleave', 'drop']) {
  drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.remove('over'); });
}
drop.addEventListener('drop', (e) => enqueue([...e.dataTransfer.files]));

// Stop the browser from navigating away when a file misses the drop zone.
for (const type of ['dragover', 'drop']) {
  window.addEventListener(type, (e) => e.preventDefault());
}

function enqueue(files) {
  for (const file of files) {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const row = addRow(file.name);
    if (!ALLOWED.includes(ext)) {
      setStatus(row, 'error', `Unsupported file type: ${ext || '(none)'}`);
      continue;
    }
    pending.push({ file, row });
  }
  drain();
}

async function drain() {
  if (running) return;
  running = true;
  while (pending.length) {
    const job = pending.shift();
    await transcribe(job.file, job.row);
  }
  running = false;
}

async function transcribe(file, row) {
  const started = Date.now();
  const tick = setInterval(() => {
    setStatus(row, 'working', `Transcribing… ${elapsed(started)}`);
  }, 1000);
  setStatus(row, 'working', 'Uploading…');

  try {
    const body = new FormData();
    body.append('audio', file);
    const res = await fetch('/api/transcribe', { method: 'POST', body });

    if (!res.ok) {
      let msg = `Server error (${res.status})`;
      try { msg = (await res.json()).error || msg; } catch { /* non-JSON body */ }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const name = filenameFrom(res) || file.name.replace(/\.[^.]+$/, '') + '.txt';
    saveAs(blob, name);
    setStatus(row, 'done', `Saved ${name} to Downloads · ${elapsed(started)}`);
  } catch (err) {
    setStatus(row, 'error', err.message);
  } finally {
    clearInterval(tick);
  }
}

function saveAs(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function filenameFrom(res) {
  const header = res.headers.get('Content-Disposition') || '';
  return header.match(/filename="?([^";]+)"?/)?.[1] ?? null;
}

function elapsed(since) {
  const total = Math.round((Date.now() - since) / 1000);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return m ? `${m}m ${s}s` : `${s}s`;
}

function addRow(name) {
  const li = document.createElement('li');
  li.className = 'item';
  li.innerHTML = `
    <span class="spinner"></span>
    <span class="meta">
      <span class="name"></span>
      <span class="status">Queued</span>
    </span>`;
  li.querySelector('.name').textContent = name;
  queueEl.prepend(li);
  return li;
}

function setStatus(row, state, text) {
  row.className = `item ${state}`;
  row.querySelector('.status').textContent = text;
  const icon = row.firstElementChild;
  if (state === 'working') {
    icon.className = 'spinner';
    icon.textContent = '';
  } else {
    icon.className = 'badge';
    icon.textContent = state === 'done' ? '✓' : '✕';
  }
}
