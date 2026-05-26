---
title: GitLab Self-Hosted Installation Plan — Mac mini
date: 2026-05-26
target_host: Mac mini (Apple Silicon or Intel)
gitlab_edition: Community Edition (CE) — switch to EE if a paid tier is licensed
install_method: Docker (Linux package not supported on macOS)
sources:
  - https://about.gitlab.com/install/
  - https://docs.gitlab.com/install/docker/installation/
  - https://docs.gitlab.com/install/docker/configuration/
  - https://docs.gitlab.com/install/requirements/
  - https://docs.gitlab.com/security/
  - https://docs.gitlab.com/security/hardening_general_concepts/
---

# GitLab Installation Plan — Mac mini

## 0. Important context

GitLab does **not** publish a native macOS installer. The Linux Package (Omnibus) is built only for supported Linux distributions. On a Mac mini you have two viable paths:

| Path | When to choose | Trade-offs |
|------|----------------|------------|
| **Docker (recommended)** | Easiest, GitLab-supported, runs the official `gitlab/gitlab-ce` image | Requires Docker Desktop or Colima; modest performance overhead on Apple Silicon |
| **Linux VM (UTM / Parallels / VMware Fusion / Multipass)** | If you want the canonical Omnibus install on Ubuntu/Debian | Extra layer to maintain; VM tools/licensing to manage |

The rest of this plan uses **Docker** as the primary method. A short VM alternative is included at the end.

---

## 1. Hardware check

GitLab's published minimums (for ~20 req/s, ≤1,000 users):

- **CPU:** 8 vCPU recommended; 4 vCPU acceptable for a small team
- **RAM:** 16 GB recommended; 8 GB minimum
- **Disk:** 40 GB minimum free + space for every repository you plan to host; SSD strongly preferred
- **Swap:** Enabled (macOS handles this automatically)

For a small team Mills deployment, a Mac mini M2/M4 with 16 GB RAM and 512 GB+ SSD is comfortable. Apple Silicon runs the `linux/arm64` GitLab image natively.

---

## 2. Prerequisites on the Mac mini

1. **Update macOS** to the latest point release. Apply all pending security updates.
2. **Create a dedicated admin account** on the Mac mini called e.g. `gitlab-admin` — do not run GitLab from a personal day-to-day account.
3. **Enable FileVault** (System Settings → Privacy & Security → FileVault). Record the recovery key in a password manager.
4. **Set a firmware password** (Intel Macs only) or ensure **Recovery Lock** is enabled (Apple Silicon, via MDM if managed).
5. **Disable auto-login**; require password immediately after sleep.
6. **Configure the firewall** (System Settings → Network → Firewall → On). Allow only the inbound services you need.
7. **Set a static IP** on the LAN (router DHCP reservation is fine).
8. **Pick a hostname** the LAN/Internet will reach the server at — e.g. `gitlab.mills.local` for LAN-only, or `gitlab.example.com` for public.
9. **Install Docker Desktop for Mac** (https://www.docker.com/products/docker-desktop/) and grant it enough resources:
   - Settings → Resources → CPUs: ≥ 4
   - Settings → Resources → Memory: ≥ 8 GB (12+ preferred)
   - Settings → Resources → Disk image size: ≥ 80 GB
10. Verify Docker: `docker --version` and `docker compose version`.

---

## 3. DNS and TLS

Decide **before** install, because the `external_url` baked into GitLab determines how clones, webhooks, and emails reference the server.

- **LAN-only deployment:** create a DNS A-record on your local DNS (or a `/etc/hosts` entry on every client) like `gitlab.mills.local → 192.168.x.x`. You can issue TLS via a private CA or use plain HTTP on the LAN.
- **Public deployment:** register the hostname in DNS, open ports 80/443/22 on the router with port forwards to the Mac mini, and let GitLab obtain a Let's Encrypt certificate at first boot (requires port 80 reachable from the internet).
- For Mills, LAN-only is typical. If you want HTTPS on the LAN, generate an internal cert and mount it into `/etc/gitlab/ssl/` inside the container.

---

## 4. Prepare the host filesystem

Pick a stable, backed-up location for GitLab data. The default convention is `/srv/gitlab`, but on macOS a path under the admin home is more typical:

```bash
export GITLAB_HOME=/Users/gitlab-admin/gitlab
mkdir -p "$GITLAB_HOME"/{config,logs,data,backups}
```

Add the `export` line to `~/.zshrc` so the variable persists across sessions.

Three subpaths get mounted into the container:

| Host path | Container path | Purpose |
|-----------|---------------|---------|
| `$GITLAB_HOME/config` | `/etc/gitlab` | `gitlab.rb`, secrets, SSL certs |
| `$GITLAB_HOME/logs` | `/var/log/gitlab` | All component logs |
| `$GITLAB_HOME/data` | `/var/opt/gitlab` | Repositories, DB, uploads, artifacts |

---

## 5. Create the `docker-compose.yml`

Save to `$GITLAB_HOME/docker-compose.yml`:

```yaml
services:
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: gitlab
    restart: always
    hostname: 'gitlab.mills.local'      # <-- change to your real hostname
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.mills.local'
        # SSH stays on a non-default host port to avoid colliding with macOS sshd
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
        # Lock down sign-ups — only admin creates accounts
        gitlab_rails['gitlab_signup_enabled'] = false
        # SMTP — fill in real values, see Section 8
        gitlab_rails['smtp_enable'] = false
        # Daily backup at 02:00, keep 7 days
        gitlab_rails['backup_keep_time'] = 604800
    ports:
      - '80:80'
      - '443:443'
      - '2222:22'
    volumes:
      - '${GITLAB_HOME}/config:/etc/gitlab'
      - '${GITLAB_HOME}/logs:/var/log/gitlab'
      - '${GITLAB_HOME}/data:/var/opt/gitlab'
      - '${GITLAB_HOME}/backups:/var/opt/gitlab/backups'
    shm_size: '256m'
```

Notes:
- `gitlab/gitlab-ce:latest` is fine for a first install; pin to a specific tag (e.g. `gitlab/gitlab-ce:17.10.0-ce.0`) before going live so upgrades are deliberate.
- Port 22 on the Mac mini is already used by macOS Remote Login. Mapping container 22 → host **2222** sidesteps the conflict. Git URLs become `ssh://git@gitlab.mills.local:2222/group/repo.git`.

---

## 6. Start GitLab

```bash
cd "$GITLAB_HOME"
docker compose up -d
docker compose logs -f gitlab
```

First boot takes 5–10 minutes (initdb, migrations, asset compilation). Wait until `gitlab Reconfigured!` appears.

Confirm the container is healthy:

```bash
docker compose ps
docker exec -it gitlab gitlab-ctl status
```

---

## 7. Retrieve the initial root password

GitLab writes a one-time root password during first boot:

```bash
docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

- File is auto-deleted on the first container restart **after 24 hours** — copy the password to your password manager immediately.
- Log in at `https://gitlab.mills.local` as username `root` with this password.
- **Immediately**: change the password, set a real email, enable 2FA on the root account, and save the recovery codes.

---

## 8. Post-install configuration

All settings below live in `$GITLAB_HOME/config/gitlab.rb`. After editing, run:

```bash
docker exec -it gitlab gitlab-ctl reconfigure
```

### 8a. SMTP (so GitLab can email)

```ruby
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = 'smtp.example.com'
gitlab_rails['smtp_port'] = 587
gitlab_rails['smtp_user_name'] = 'gitlab@example.com'
gitlab_rails['smtp_password'] = '<see credentials file>'
gitlab_rails['smtp_domain'] = 'example.com'
gitlab_rails['smtp_authentication'] = 'login'
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['gitlab_email_from'] = 'gitlab@example.com'
```

### 8b. TLS

- **Let's Encrypt (public hostname only):** GitLab auto-issues if `external_url` is `https://…` and port 80 is reachable. Confirm with:
  ```ruby
  letsencrypt['enable'] = true
  letsencrypt['contact_emails'] = ['admin@example.com']
  letsencrypt['auto_renew'] = true
  ```
- **Private CA / self-signed:** place `gitlab.mills.local.crt` and `gitlab.mills.local.key` in `$GITLAB_HOME/config/ssl/` (matches `/etc/gitlab/ssl` inside the container). Set `external_url 'https://…'` and reconfigure.

### 8c. Backups

GitLab's built-in backup task:

```bash
docker exec -t gitlab gitlab-backup create CRON=1
```

- Backups land in `$GITLAB_HOME/backups`.
- Two extra items must be backed up **separately** because they are not in the application dump:
  - `$GITLAB_HOME/config/gitlab-secrets.json` — DB encryption keys; without it a restored backup is unreadable
  - `$GITLAB_HOME/config/gitlab.rb` — your configuration
- Schedule a daily backup with `launchd` or `cron` on the Mac mini host; replicate the resulting tarball + secrets file off-machine (Time Machine to external drive is acceptable; off-site replication is better).

### 8d. Container Registry, Pages, CI Runner

Decide whether to enable each:
- **Container Registry**: adds Docker image hosting. Needs its own DNS name or sub-path.
- **GitLab Pages**: static site hosting. Requires a wildcard DNS entry.
- **GitLab Runner**: install separately on a second machine (or in a second container) and register against this instance using a runner registration token created in the admin UI.

Skip these on first install; enable later once the base instance is stable.

---

## 9. Security hardening

Apply in order. Each item maps to GitLab's published hardening guidance.

### 9a. Mac mini host

- FileVault on (encryption at rest).
- Firewall on; allow inbound only on 80, 443, and the SSH port you chose (2222).
- macOS Remote Login: disable unless you actively use it; if enabled, restrict to a specific admin user and require keys, not passwords.
- Software Update set to install security responses automatically.
- Time Machine encrypted backup to an external SSD.
- Do not install unrelated services (web browsers signed into personal accounts, sync agents, etc.) on this host.

### 9b. GitLab application

- **Disable sign-ups**: Admin → Settings → General → Sign-up restrictions → uncheck *Sign-up enabled*.
- **Require admin approval** for new accounts (belt-and-suspenders even with sign-ups disabled).
- **Enforce 2FA for all users** (Admin → Settings → General → Sign-in restrictions → *Two-factor authentication*).
- **Password complexity**: require ≥ 12 chars, complexity rules, no common passwords.
- **Session lifetime**: shorten to 1 week or less.
- **SSH key policy**: minimum 2048-bit RSA or ban RSA in favor of ED25519.
- **Outbound webhook filtering**: block requests to local/private networks (Admin → Settings → Network → Outbound requests).
- **Rate limiting**: enable defaults under Admin → Settings → Network → User and IP rate limits.
- **Audit events**: enabled by default; review weekly. Stream to a SIEM if available.
- **Rotate the root account**: after creating a personal admin user with 2FA, demote the `root` account or block it; never share root credentials.
- **`gitlab-secrets.json`**: treat as a crown-jewel secret; back up to encrypted storage; rotate per GitLab's secret rotation guide if anyone unauthorized had access.
- **Patch cadence**: subscribe to https://about.gitlab.com/releases/categories/releases/ and apply security releases (`X.Y.Z+1`) within 7 days.
- **Antivirus exclusions** (if any AV is installed on the Mac mini): exclude `$GITLAB_HOME` from scanning to avoid corrupting repos.

### 9c. Network

- Place the Mac mini on a VLAN/segment without lateral access to user laptops if possible.
- If exposed publicly, put a reverse proxy (Caddy, Nginx, or a hosted WAF/CDN) in front of GitLab for TLS termination and request filtering.
- Forward only 80/443 on the router; never forward 22 to the GitLab SSH port unless required for off-LAN git over SSH.

---

## 10. First-week checklist

- [ ] Root password retrieved, changed, and stored in password manager
- [ ] Real admin user created, 2FA enabled, recovery codes stored
- [ ] Root account demoted or blocked
- [ ] Sign-up disabled
- [ ] 2FA enforced instance-wide
- [ ] SMTP configured and test email received
- [ ] TLS certificate installed and `https://gitlab.mills.local` loads cleanly
- [ ] First manual backup created and restored on a scratch container to verify
- [ ] Daily backup cron/launchd job running
- [ ] `gitlab-secrets.json` copied to encrypted off-host storage
- [ ] GitLab version pinned in `docker-compose.yml`
- [ ] Audit log reviewed
- [ ] Upgrade plan documented (image bump + `docker compose pull && up -d`)

---

## 11. Alternative: Linux VM path (summary)

If you'd rather run the canonical Omnibus install:

1. Install UTM (free) or Parallels Desktop on the Mac mini.
2. Create an Ubuntu 24.04 LTS VM with 4+ vCPU, 8+ GB RAM, 60+ GB disk; bridged networking.
3. Inside the VM, follow https://about.gitlab.com/install/#ubuntu (apt repo + `EXTERNAL_URL=… apt install gitlab-ce`).
4. The Linux Package handles its own systemd services; everything else (DNS, TLS, backups, hardening) carries over from sections 3 and 9 above, but applied inside the VM.
5. Bridge or port-forward 80/443/22 from the host Mac to the VM.

The trade-off is one more layer (VM tooling + Linux patching) versus a Docker-native deployment that GitLab actively supports.

---

## 12. Credentials

See [`GitLab-credentials.md`](./GitLab-credentials.md) in this directory for the full table of credentials you'll create or receive during this process.
