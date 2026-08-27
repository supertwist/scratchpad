# Setting up the Watertight server on the Mac mini

The mini is `jamess-mac-mini`, Tailscale IP **100.105.251.86**.

Everything below is done **on the mini**, either sitting at it or over SSH once
step 1 is finished. Total time: about 20 minutes, most of it waiting on
downloads.

---

## Step 1 — Turn on Remote Login (so you can work from your laptop)

Right now the mini refuses SSH connections, which is why this has to start at
the machine itself.

**At the mini:**

1. Open **System Settings → General → Sharing**.
2. Turn **Remote Login** on.
3. Click the **(i)** next to it and confirm your user (`james`) is allowed.

**Then from your MacBook**, copy your key over so you are not typing a password
every time:

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub james@100.105.251.86
ssh james@100.105.251.86 'hostname && sw_vers -productVersion'
```

You should see `jamess-mac-mini` and the macOS version. From here on you can do
everything from the laptop.

---

## Step 2 — Install the prerequisites

```bash
ssh james@100.105.251.86
```

Check what is already there:

```bash
python3 --version     # need 3.10 or newer
git --version
```

If `python3` is missing or older than 3.10, install Homebrew and Python:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"
brew install python@3.12
```

If `git` prompts to install the Xcode command line tools, accept — the build of
`pymeshfix` needs a compiler if no wheel is available for your macOS version.

---

## Step 3 — Get the code onto the mini

```bash
mkdir -p ~/Apps && cd ~/Apps
git clone https://github.com/supertwist/scratchpad.git
cd scratchpad/Research/personal/watertight/server
```

If the repo is private, either use a deploy key or just copy the folder from
your laptop instead:

```bash
# run this on the MacBook, not the mini
rsync -av --exclude .venv --exclude dist --exclude node_modules \
  ~/GIT/scratchpad/Research/personal/watertight/ \
  james@100.105.251.86:~/Apps/watertight/
```

---

## Step 4 — Run the installer

```bash
cd ~/Apps/watertight/server     # or .../scratchpad/Research/personal/watertight/server
./install.sh --no-auth
```

`--no-auth` means no access token: anyone who can reach the address can use it.
That is what you asked for, and it is the simplest thing for students — they
just open a URL. See "Adding a token later" below when you want to change it.

The installer:

- creates a virtualenv in `server/.venv`
- installs `trimesh`, `pymeshfix`, `networkx`, `scipy`, `fastapi`, `uvicorn`
- runs a self-test that breaks a sphere and repairs it, so a broken install
  fails here rather than in front of a student
- (without `--no-auth`) generates an access token in `server/.token`, mode 600
- installs a launchd agent so the service starts at login and restarts on crash
- waits for the service to answer, then prints the token and addresses

It is safe to re-run — it stops the service, updates, and restarts.

Verify:

```bash
curl -s http://127.0.0.1:8765/api/health
```

Expected: `{"status":"ok", ... "pymeshfix":true, ...}`

> If `pymeshfix` reports `false`, the last-resort repair stage is missing and
> badly damaged meshes will fail. Fix it with
> `~/Apps/watertight/server/.venv/bin/pip install pymeshfix` and
> `launchctl kickstart -k gui/$(id -u)/edu.gwu.corcoran.watertight`.

---

## Step 5 — Test from your laptop over Tailscale

```bash
curl -s http://100.105.251.86:8765/api/health
```

If that works, open `http://100.105.251.86:8765` in a browser — you should get
the Watertight dropzone. Paste the token when it asks.

If it times out, the mini's firewall is blocking the port:

**System Settings → Network → Firewall → Options** → either turn off
"Block all incoming connections", or add the Python binary at
`~/Apps/watertight/server/.venv/bin/python` and allow it.

---

## Step 6 — Keep the mini awake

A sleeping mini serves nothing. As an always-on server it should never sleep:

```bash
sudo pmset -a sleep 0 disksleep 0 displaysleep 10
sudo pmset -a autorestart 1      # come back after a power cut
sudo pmset -g                    # confirm
```

`displaysleep 10` just blanks the screen, which is fine.

---

## Step 7 — Survive a reboot

The service is a **LaunchAgent**, so it starts when your user logs in, not at
boot. After an unattended restart nobody is logged in and Watertight is down.

Enable automatic login:

**System Settings → Users & Groups → Automatically log in as → james**

(FileVault must be off for this to work. If FileVault has to stay on, convert
the agent to a system-wide LaunchDaemon in `/Library/LaunchDaemons/` instead —
ask me and I will adjust the plist.)

Test it properly:

```bash
sudo reboot
# wait a minute, then from the laptop:
curl -s http://100.105.251.86:8765/api/health
```

---

## Step 8 — Expose it beyond the tailnet with Funnel (optional)

Students on the tailnet need nothing more. Funnel is for students **not** on
Tailscale — it publishes an HTTPS URL on the public internet.

> Funnel puts this server on the public internet. With `--no-auth` there is
> nothing stopping anyone who learns the URL from uploading meshes and using
> the mini's CPU. The URL is not guessable and not published anywhere, which is
> the only thing protecting it. If that stops feeling comfortable, see "Adding
> a token later" — it is a one-command change and students need no new software.

1. In the [Tailscale admin console](https://login.tailscale.com/admin/dns),
   enable **HTTPS Certificates** under DNS.
2. In **Access Controls**, make sure your ACL policy grants the `funnel`
   attribute — the default policy includes:

   ```json
   "nodeAttrs": [ { "target": ["autogroup:member"], "attr": ["funnel"] } ]
   ```

3. On the mini:

   ```bash
   export PATH="/Applications/Tailscale.app/Contents/MacOS:$PATH"
   tailscale funnel --bg 8765
   tailscale funnel status
   ```

   It prints the public URL, of the form:

   ```
   https://jamess-mac-mini.<your-tailnet>.ts.net
   ```

4. Test from a device with Tailscale switched **off**, e.g. a phone on cellular.

To take it down again:

```bash
tailscale funnel --https=443 off
```

Give students that HTTPS URL as the **Server address** in the app, plus the
token.

---

## Day-to-day operation

```bash
L=gui/$(id -u)/edu.gwu.corcoran.watertight

launchctl print $L | head -20              # status
launchctl kickstart -k $L                   # restart
launchctl bootout $L                        # stop
tail -f ~/Library/Logs/Watertight/watertight.log        # live log
tail -50 ~/Library/Logs/Watertight/watertight.error.log # crashes
```

Every repair logs one line, so you can see what students are running:

```
2026-08-27 19:04:11 INFO  watertight  repair  bunny.stl  1.83s  success=True rebuilt=False -> bunny-FIXED.stl
```

### Adding a token later

This is the payoff of serving a web page rather than shipping an app: turning
auth on is one command on the mini, and every student picks it up on their next
page load. Nothing to redistribute.

```bash
cd ~/Apps/watertight/server
./install.sh --token corcoran-fall-2026
```

The page will then ask for the token and remember it per browser. To go back:

```bash
./install.sh --no-auth
```

### Tuning

Edit `~/Library/LaunchAgents/edu.gwu.corcoran.watertight.plist`, then
`launchctl bootout` + `bootstrap` (or just re-run `install.sh`):

| Variable | Default | Meaning |
|---|---|---|
| `WATERTIGHT_TOKEN` | generated | shared class token |
| `PORT` | `8765` | listen port |
| `WATERTIGHT_MAX_MB` | `200` | largest upload accepted |
| `WATERTIGHT_MAX_FACES` | `5000000` | largest mesh accepted |
| `WATERTIGHT_WORKERS` | cores − 2 | concurrent repair jobs |

`WATERTIGHT_WORKERS` is the one that matters with a class of 20. Each worker
can use a full core and a few hundred MB on a large mesh. The installer leaves
two cores free so the mini stays responsive.

---

## Updating the server later

```bash
ssh james@100.105.251.86
cd ~/Apps/watertight            # or the git checkout
git pull                        # or re-run the rsync from your laptop
cd server && ./install.sh       # reuses the existing token
```
