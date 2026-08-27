# Giving me (Claude) direct access to the mini

## Current state: I cannot reach it

I can see the mini on your tailnet from this MacBook:

```
100.105.251.86   jamess-mac-mini   supertwist@   macOS
```

Ping works (~98 ms). But SSH is refused:

```
$ ssh james@100.105.251.86
ssh: connect to host 100.105.251.86 port 22: Connection refused
```

"Connection refused" means nothing is listening on port 22 — **Remote Login is
switched off** on the mini. No key or password will help until that changes,
and it can only be changed at the machine itself (or via Screen Sharing, if you
already have that on).

## What I need from you

**One thing, done at the mini:**

> **System Settings → General → Sharing → Remote Login: ON**
>
> Click the **(i)** button and make sure `james` is in the allowed list.

**Then, from this MacBook** (you run this, because it needs your password once):

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub james@100.105.251.86
```

Verify it took:

```bash
ssh -o BatchMode=yes james@100.105.251.86 'hostname'
```

If that prints `jamess-mac-mini` with no password prompt, I can take over: I
already have `~/.ssh/id_rsa` available in this session, so key-based SSH will
work for me too.

Tell me when it's done and I will install and start the service for you.

## What I would do with that access

1. `rsync` the `watertight/` folder to `~/Apps/watertight/` on the mini
2. Run `server/install.sh`, which builds the venv, self-tests the repair
   engine, and registers the launchd agent
3. Verify `/api/health` locally on the mini and from this laptop over Tailscale
4. Report the generated access token back to you
5. If you want Funnel, run `tailscale funnel --bg 8765` and hand you the public
   HTTPS URL

## Things I still cannot do, even with SSH

These need a human at the machine or in a browser, because they are GUI or
account-level:

| Task | Why | Who |
|---|---|---|
| Enable Remote Login | GUI toggle, and it is the prerequisite for SSH itself | you, at the mini |
| Firewall allow for Python | GUI panel; no reliable CLI equivalent on modern macOS | you, at the mini |
| Automatic login after reboot | GUI, and needs FileVault off | you, at the mini |
| Tailscale HTTPS certs + `funnel` ACL attribute | Tailscale admin console, tied to your account | you, in a browser |
| `sudo pmset` sleep settings | needs your admin password interactively | you (or paste me the output) |

I can do everything else: the code, the venv, the service, the token, the
health checks, and the Funnel command itself once the ACL allows it.

## A note on what I would be running

`install.sh` installs from PyPI into a virtualenv scoped to the app directory.
It touches only:

- `~/Apps/watertight/` (the code and its `.venv`)
- `~/Library/LaunchAgents/edu.gwu.corcoran.watertight.plist`
- `~/Library/Logs/Watertight/`

Nothing needs `sudo`, nothing is installed system-wide, and uninstalling is
`launchctl bootout` plus deleting those three paths.
