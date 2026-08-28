# Watertight — operations runbook

How to change things after the initial install. For first-time setup see
[MINI-SETUP.md](MINI-SETUP.md); for SSH access see
[REMOTE-ACCESS.md](REMOTE-ACCESS.md).

---

## As deployed (2026-08-28)

| | |
|---|---|
| Machine | Mac mini, local hostname `MONUMENT`, Tailscale `jamess-mac-mini` |
| Tailscale IP | `100.105.251.86` |
| **Account** | **`gitlabadmin`** (not `james` — see REMOTE-ACCESS.md) |
| Student URL | `http://100.105.251.86:8765` |
| Code | `/Users/gitlabadmin/Apps/watertight` |
| Python | private **3.12.14** via `uv`, at `server/.venv` |
| Authentication | **none** (`--no-auth`) |
| Workers | **2** |
| Max upload | **150 MB** |
| launchd label | `edu.gwu.corcoran.watertight` |
| Logs | `~/Library/Logs/Watertight/watertight.log` |
| Hardware | 8 cores, 8 GB RAM, 228 GB disk |

macOS ships Python 3.9.6, which is too old — numpy 2.x and scipy need 3.10+,
and FastAPI evaluates `str | None` annotations at runtime. Homebrew would need
an admin password, so `install.sh` bootstraps `uv` and fetches a private
interpreter into the home directory. Nothing is installed system-wide and no
`sudo` is used.

---

## Service control

Run from the laptop (`ssh mini '<command>'`) or at the mini directly.

```bash
L=gui/$(id -u)/edu.gwu.corcoran.watertight

launchctl print $L | head -20                # status
launchctl kickstart -k $L                    # restart
launchctl bootout $L                         # stop
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/edu.gwu.corcoran.watertight.plist   # start

curl -s http://127.0.0.1:8765/api/health     # is it alive?
tail -f ~/Library/Logs/Watertight/watertight.log
tail -50 ~/Library/Logs/Watertight/watertight.error.log
```

`KeepAlive` is on, so a crashed process returns within about 10 seconds. This
has been verified by killing it with `kill -9`.

Every repair logs one line:

```
2026-08-27 19:04:11 INFO watertight repair bunny.stl 1.83s success=True rebuilt=False -> bunny-FIXED.stl
```

---

## Changing authentication

This is the payoff of serving a web page instead of shipping an app: **turning
auth on or off needs no client-side change.** Students pick it up on their next
page load — nothing to redistribute.

**Require a token:**

```bash
ssh mini 'cd ~/Apps/watertight/server && ./install.sh --token corcoran-fall-2026'
```

The page then asks for the token and remembers it per browser (in
`localStorage`). The desktop app takes it under Settings.

**Generate a random token instead** — omit `--token`; the value is printed at
the end and saved to `server/.token` (mode 600):

```bash
ssh mini 'cd ~/Apps/watertight/server && ./install.sh'
ssh mini 'cat ~/Apps/watertight/server/.token'      # read it back later
```

**Go back to open access:**

```bash
ssh mini 'cd ~/Apps/watertight/server && ./install.sh --no-auth'
```

`install.sh` is safe to re-run: it stops the service, updates, and restarts.
Without `--token` or `--no-auth` it reuses the existing token.

> The server **refuses to start with no token** unless
> `WATERTIGHT_ALLOW_NO_AUTH=1` is set, which `--no-auth` does for you. That
> guard exists so a tokenless server is always a deliberate choice, never an
> accident — it matters most with Funnel, which puts the service on the public
> internet.

---

## Power settings

An always-on server must never sleep. Applied 2026-08-28:

```bash
ssh -t mini 'sudo pmset -a sleep 0 disksleep 0 displaysleep 10 autorestart 1'
```

**`ssh -t` is required.** `sudo` needs a terminal to prompt for a password, and
plain `ssh` allocates none — without `-t` it fails with *"sudo: a terminal is
required to read the password."* The password is **`gitlabadmin`'s**, since
`sudo` runs on the mini.

| Setting | Was | Now | Why |
|---|---|---|---|
| `sleep` | `1` | `0` | never sleep — the one that matters |
| `disksleep` | `10` | `0` | don't spin down storage |
| `displaysleep` | `0` | `10` | blank the screen after 10 min; cosmetic |
| `autorestart` | `0` | `1` | reboot automatically after a power cut |

**Verify — and check the right thing:**

```bash
ssh mini 'pmset -g'          # live values
ssh mini 'pmset -g custom'   # SAVED values -- these survive a reboot
```

Use `pmset -g custom`. `pmset -g` shows what is in effect right now, which can
differ from what is stored.

### Reading `pmset -g` without alarm

Two parentheticals show up and neither is a problem:

- **`sleep 0 (sleep prevented by powerd)`** — an *assertion*, a separate
  mechanism from the setting. Its reason is "Prevent sleep while display is
  on", so it lapses when the display sleeps. Belt-and-braces on top of
  `sleep 0`, not a substitute. `sleep 0` is what you rely on.
- **`displaysleep 10 (display sleep prevented by Dock)`** — the Dock is holding
  the screen awake while someone is logged in at the console. Cosmetic; it does
  not affect serving.

Inspect assertions with `ssh mini 'pmset -g assertions'`.

---

## Surviving a reboot

The service is a **LaunchAgent**, so it starts when `gitlabadmin` logs in — not
at boot. After an unattended restart, nobody is logged in and Watertight is
down. `autorestart 1` powers the machine back up but does not log anyone in, so
**the two settings only work together.**

Enable automatic login:

**System Settings → Users & Groups → Automatically log in as → `gitlabadmin`**

FileVault must be off for this to work.

Then test it honestly:

```bash
ssh -t mini 'sudo reboot'
# wait a minute or two
curl -s http://100.105.251.86:8765/api/health
```

> **If FileVault must stay on**, automatic login is impossible and the agent
> cannot start unattended. The fix is to convert it to a system-wide
> **LaunchDaemon** in `/Library/LaunchDaemons/`, which starts at boot with no
> login. That needs `sudo`, a different plist owner (`root:wheel`, mode 644),
> and a `UserName` key so the service still runs as `gitlabadmin`.

---

## Tuning

Edit `~/Library/LaunchAgents/edu.gwu.corcoran.watertight.plist`, then
`launchctl kickstart -k` — or just re-run `install.sh`, which recomputes them.

| Variable | Deployed | Meaning |
|---|---|---|
| `WATERTIGHT_TOKEN` | *(empty)* | shared class token |
| `WATERTIGHT_ALLOW_NO_AUTH` | `1` | permit running with no token |
| `PORT` | `8765` | listen port |
| `WATERTIGHT_MAX_MB` | `150` | largest upload accepted |
| `WATERTIGHT_MAX_FACES` | `5000000` | largest mesh accepted |
| `WATERTIGHT_WORKERS` | `2` | concurrent repair jobs |

### Why 2 workers on an 8-core machine

`install.sh` sizes the pool against **both cores and RAM**, taking the lower:

```
workers = clamp( min(cores - 2, floor(RAM_GB / 4)), 1, 4 )
```

The mini has 8 cores but only 8 GB, giving `min(6, 2) = 2`. Core count alone
would have chosen 6, and six concurrent repairs — each holding a full mesh plus
PyMeshFix's working copies — would push an 8 GB machine into swap, which is far
slower than queueing. On the same reasoning, uploads are capped at 150 MB
rather than 200 on machines with 8 GB or less.

Raise them explicitly if you add RAM or find the queue too slow:

```bash
ssh mini 'cd ~/Apps/watertight/server && ./install.sh --no-auth --workers 4'
```

---

## Tailscale Funnel (public HTTPS)

Only needed for students **not** on the tailnet. Not currently configured.

Prerequisites, both in the [admin console](https://login.tailscale.com/admin):
enable **HTTPS Certificates** under DNS, and grant the `funnel` node attribute
in Access Controls:

```json
"nodeAttrs": [ { "target": ["autogroup:member"], "attr": ["funnel"] } ]
```

Then:

```bash
ssh mini 'export PATH="/Applications/Tailscale.app/Contents/MacOS:$PATH"; tailscale funnel --bg 8765; tailscale funnel status'
```

Take it down with `tailscale funnel --https=443 off`.

> Funnel publishes the service on the public internet. With `--no-auth` the
> only thing protecting it is that the URL is not guessable or published.
> Consider `--token` before enabling Funnel — see *Changing authentication*; it
> requires no change on any student's machine.

---

## Firewall

**Not required.** Port 8765 was reachable from the laptop over Tailscale
immediately after install, so the macOS application firewall did not need
touching. If that ever changes, allow the venv Python explicitly:
`~/Apps/watertight/server/.venv/bin/python`.

---

## Updating the code

From the laptop:

```bash
cd ~/GIT/scratchpad/Research/personal/watertight
rsync -az --delete \
  --exclude '.venv' --exclude 'node_modules' --exclude 'dist' \
  --exclude '__pycache__' --exclude '.token' --exclude 'app/build/icon.iconset' \
  ./ mini:~/Apps/watertight/
ssh mini 'cd ~/Apps/watertight/server && ./install.sh --no-auth'
```

`--delete` keeps the mini an exact mirror; the excludes protect its venv and
token. Re-running `install.sh` re-runs the engine self-test, so a bad update
fails there rather than in front of a class.

Verify afterwards:

```bash
curl -s http://100.105.251.86:8765/api/health
cd app && SERVER=http://100.105.251.86:8765 STL=/path/to/model.stl \
  ./node_modules/.bin/electron test/web-e2e.js
```

---

## SSH access, and revoking it

Access uses a dedicated passphrase-free key, `~/.ssh/mini_ed25519`
(`SHA256:UEkaD4TzeagCKWWOkFvnyHmLKIh4C4s6zqORoBJmXgw`), with a `~/.ssh/config`
entry so `ssh mini` works. `id_rsa` is untouched and keeps its passphrase —
which is precisely why it cannot be used for unattended access.

**To revoke**, delete that one line from the mini and nothing else is affected:

```bash
ssh mini "grep -v 'UEkaD4TzeagCKWWOkFvnyHmLKIh4C4s6zqORoBJmXgw' ~/.ssh/authorized_keys > /tmp/ak && mv /tmp/ak ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Back up `authorized_keys` before editing it by hand — it controls access to the
machine, and a malformed line locks everyone out. Permissions must stay: `~`
not group-writable, `~/.ssh` `700`, `authorized_keys` `600`. sshd silently
ignores the key otherwise.

---

## Uninstall

```bash
ssh mini 'cd ~/Apps/watertight/server && ./uninstall.sh'     # stop + remove the agent
ssh mini 'rm -rf ~/Apps/watertight ~/Library/Logs/Watertight'  # remove code and logs
```

Nothing was installed system-wide, so that is the whole footprint (plus `uv` in
`~/.local/bin` and its cached Python in `~/.local/share/uv`).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Students can't load the page | mini asleep, rebooted without login, or they're off Tailscale | `curl .../api/health`; check auto-login |
| `Connection closed by … port 22` | wrong SSH username — it's `gitlabadmin` | see REMOTE-ACCESS.md |
| `sudo: a terminal is required` | missing `-t` on ssh | `ssh -t mini 'sudo …'` |
| Health shows `"pymeshfix": false` | dependency missing; severe damage can't be repaired | re-run `install.sh` |
| Repairs are slow / queueing | 2 workers by design on 8 GB | `--workers 4`, watch for swap |
| `413` on upload | over the 150 MB cap | decimate the mesh, or raise `WATERTIGHT_MAX_MB` |
| Service won't start | bad config | `tail -50 ~/Library/Logs/Watertight/watertight.error.log` |
