---
title: Public Deployment of GitLab via Route 53 — gitlab.superluckyland.com
date: 2026-05-26
domain: superluckyland.com (hosted in AWS Route 53)
subdomain: gitlab.superluckyland.com
target: GitLab running in Docker on a Mac mini (Mills)
companion_docs:
  - Gitlab-install.md
  - GitLab-credentials.md
---

# Public Deployment: gitlab.superluckyland.com → Mac mini

## Quick answers

| Question | Answer |
|----------|--------|
| Is it possible to point `gitlab.superluckyland.com` at the Mac mini? | **Yes** — Route 53 is just DNS; the A record can point at any reachable IP. |
| Do you need to host GitLab in AWS? | **No.** Route 53 (DNS) is separate from compute. You can keep GitLab on the Mac mini and only use AWS for the name lookup. |
| Can AWS act as a pass-through to the Mac mini? | **Yes**, two ways: (a) Route 53 A record → home public IP + router port forwards (cheapest, but depends on your ISP), or (b) Route 53 → a small EC2 reverse proxy → tunnel to the Mac mini (works around residential ISP limits, costs ~$5–15/month). Both are covered below. |

This doc walks through the **direct** approach as the primary path (matches what you described), then gives the **EC2 pass-through** as a fallback if your ISP blocks ports or uses CGNAT.

---

## Part 1 — Pre-flight checks (do these first)

These three checks decide whether the direct approach will work at all. Run them from the Mac mini before changing any DNS.

### 1.1 Find your real public IP

```bash
curl -4 https://ifconfig.me
curl -4 https://api.ipify.org
```

Both should return the same address.

### 1.2 Check for CGNAT (carrier-grade NAT)

CGNAT means your ISP shares one public IP among many customers and **no inbound port forwarding will ever work**.

- Log into your router's admin page.
- Find the WAN IP it reports.
- Compare it to the public IP from step 1.1.

| Router WAN IP | Public IP | Diagnosis |
|---------------|-----------|-----------|
| Same | Same | You have a real public IP — direct approach is viable |
| Router WAN is `100.64.x.x`–`100.127.x.x` | Different | **CGNAT** — skip to Part 4 (EC2 pass-through) |
| Router WAN is `10.x.x.x` or `192.168.x.x` | Different | Double NAT or CGNAT — skip to Part 4 |

### 1.3 Check whether ISP blocks ports 80/443

Many residential ISPs (Comcast, AT&T residential, some Verizon) block inbound port 80 and/or 25; a smaller number block 443. Quickest way to check:

1. Note your public IP from 1.1.
2. From a phone on cellular (not the home Wi-Fi), or from any external machine, run:
   ```bash
   nc -vz <your-public-ip> 80
   nc -vz <your-public-ip> 443
   ```
3. If both connect (even with no response), the ports are open. If they time out before you've port-forwarded anything, that's expected. The real test comes after Part 2.

If you know your ISP blocks 80/443 (check their AUP or call support), go to Part 4.

### 1.4 Static vs dynamic public IP

- **Static** (business-class or specifically purchased): you're done — point Route 53 at it.
- **Dynamic** (most residential): the IP will change occasionally; you need Route 53 dynamic updates (Part 3) so the A record follows the change.

---

## Part 2 — Direct approach: Route 53 + router port forwards

### 2.1 Create the A record in Route 53

1. AWS Console → **Route 53** → **Hosted zones** → `superluckyland.com`.
2. **Create record**.
3. Record name: `gitlab`
4. Record type: `A`
5. Value: your public IP from check 1.1
6. TTL: **300** (5 minutes — low so changes propagate fast while you're setting up; raise to 3600 once stable)
7. Routing policy: Simple routing
8. **Create records**.

Verify from the Mac mini:

```bash
dig +short gitlab.superluckyland.com
```

Should print your public IP.

### 2.2 Reserve a static LAN IP for the Mac mini

In your router's DHCP settings, create a reservation that binds the Mac mini's MAC address to a fixed LAN IP (e.g. `192.168.1.50`). This prevents the LAN IP changing and breaking your port forwards.

Find the Mac mini's current LAN IP:

```bash
ipconfig getifaddr en0   # Ethernet
ipconfig getifaddr en1   # Wi-Fi (use Ethernet if possible)
```

### 2.3 Configure router port forwards

Forward three public ports to the Mac mini's LAN IP:

| Public port | LAN IP | LAN port | Purpose |
|-------------|--------|----------|---------|
| 80/TCP | 192.168.1.50 | 80 | HTTP (needed for Let's Encrypt HTTP-01 challenge) |
| 443/TCP | 192.168.1.50 | 443 | HTTPS (clones over HTTPS, web UI) |
| 22/TCP | 192.168.1.50 | 2222 | Git over SSH (container exposes 22 on host port 2222) |

The exact UI varies by router (Eero, Asus, UniFi, Netgear, etc.) — look for "Port Forwarding", "Virtual Servers", or "NAT".

> If your router supports UPnP for port forwarding, **disable UPnP**. Manual rules are safer.

### 2.4 macOS firewall

System Settings → Network → Firewall → Options. Make sure `docker` / `com.docker.backend` are allowed inbound, or the firewall blocks the forwarded traffic before it reaches the container.

### 2.5 Update GitLab `external_url`

Edit `$GITLAB_HOME/config/gitlab.rb` (or the `GITLAB_OMNIBUS_CONFIG` block in `docker-compose.yml`) so the entry reads:

```ruby
external_url 'https://gitlab.superluckyland.com'

# Let's Encrypt — auto-issues a real cert at boot
letsencrypt['enable'] = true
letsencrypt['contact_emails'] = ['admin@superluckyland.com']   # change to a real address
letsencrypt['auto_renew'] = true
letsencrypt['auto_renew_hour'] = 3
letsencrypt['auto_renew_day_of_month'] = "*/7"

# SSH on the standard public port 22, mapped to container 22 via Docker
gitlab_rails['gitlab_shell_ssh_port'] = 22
```

Update the Docker hostname and port mapping to match:

```yaml
hostname: 'gitlab.superluckyland.com'
ports:
  - '80:80'
  - '443:443'
  - '22:2222'    # public 22 → host 2222 → container 22  — see note below
```

> **Port 22 conflict:** macOS Remote Login also uses port 22 on the Mac mini's LAN side. The cleanest split is:
> - Container publishes `22:22` on the Mac mini's LAN at host port **2222** (as in `Gitlab-install.md`).
> - Router port-forwards **public 22 → LAN 2222** on the Mac mini.
>   This way external `git clone git@gitlab.superluckyland.com:group/repo.git` works on the standard port, and macOS keeps port 22 for itself on the LAN.
>
> Set `gitlab_rails['gitlab_shell_ssh_port'] = 22` so the URLs GitLab prints to users *don't* include the 2222.

Apply the change:

```bash
cd "$GITLAB_HOME"
docker compose up -d                      # picks up docker-compose.yml changes
docker exec -it gitlab gitlab-ctl reconfigure
```

First reconfigure with HTTPS may take 2–5 minutes while Let's Encrypt completes the HTTP-01 challenge against port 80.

### 2.6 Verify

From any machine *not* on your LAN (a phone on cellular works):

```bash
curl -vI https://gitlab.superluckyland.com
```

You should see:

- TLS handshake completes with a Let's Encrypt-issued certificate (Issuer: `R3` or similar).
- HTTP `302` or `200` response.
- The browser at `https://gitlab.superluckyland.com` loads the GitLab sign-in page with a valid padlock.

Test git over SSH:

```bash
ssh -T -p 22 git@gitlab.superluckyland.com
```

Should respond with `Welcome to GitLab, @<username>!` once you've added a key.

### 2.7 Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `curl` from cellular times out on 443 | Router forward wrong, or ISP blocks 443 | Re-check forward; if blocked, go to Part 4 |
| Let's Encrypt fails with `Connection refused` on port 80 | Port 80 forward missing or ISP blocks it | Verify forward; if blocked, switch to DNS-01 challenge via Route 53 (see 2.8) |
| Cert issues but for `XX-XX-XX-XX.lightspeed.example.net` instead of your domain | `external_url` still set to old value | Edit `gitlab.rb`, `gitlab-ctl reconfigure` |
| Site loads on LAN at internal IP but not via the public name | NAT loopback (hairpin) disabled on router | Add `192.168.1.50 gitlab.superluckyland.com` to `/etc/hosts` on the Mac mini, or enable hairpin NAT |

### 2.8 If port 80 is blocked but 443 is open

Switch Let's Encrypt to the **DNS-01** challenge, which uses Route 53 instead of inbound HTTP. This requires `acme.sh` or `certbot` outside GitLab plus an IAM user with permissions on the hosted zone. It's noticeably more work — if you reach this point, the **EC2 pass-through in Part 4 is usually less effort.**

---

## Part 3 — Dynamic IP: keep Route 53 in sync

Skip if your public IP is static. Otherwise, pick one:

### Option A — Lightweight cron job on the Mac mini

1. Create an IAM user `route53-ddns` with only this policy attached:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["route53:ChangeResourceRecordSets", "route53:GetHostedZone"],
         "Resource": "arn:aws:route53:::hostedzone/<ZONE_ID>"
       },
       {
         "Effect": "Allow",
         "Action": "route53:GetChange",
         "Resource": "*"
       }
     ]
   }
   ```

2. Create an access key for that user and store it in the Mac's `~/.aws/credentials`.

3. Install AWS CLI: `brew install awscli`.

4. Save this as `~/bin/route53-update-gitlab.sh`:

   ```bash
   #!/bin/bash
   set -euo pipefail
   ZONE_ID="<YOUR_ZONE_ID>"
   NAME="gitlab.superluckyland.com."
   CURRENT_IP=$(curl -4 -s https://api.ipify.org)
   RECORDED_IP=$(aws route53 list-resource-record-sets \
     --hosted-zone-id "$ZONE_ID" \
     --query "ResourceRecordSets[?Name=='$NAME' && Type=='A'].ResourceRecords[0].Value" \
     --output text)
   if [ "$CURRENT_IP" != "$RECORDED_IP" ]; then
     aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" \
       --change-batch "{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$NAME\",\"Type\":\"A\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$CURRENT_IP\"}]}}]}"
     logger "route53-ddns: updated $NAME $RECORDED_IP -> $CURRENT_IP"
   fi
   ```

5. `chmod +x ~/bin/route53-update-gitlab.sh`.

6. Schedule with `launchd` — write `~/Library/LaunchAgents/com.mills.route53-ddns.plist` to run every 5 minutes, then `launchctl load` it. (Cron also works.)

### Option B — Third-party DDNS that supports Route 53

`ddclient` (Homebrew) supports Route 53 and is a turnkey alternative if you'd rather not write the cron script.

---

## Part 4 — AWS pass-through (EC2 reverse proxy + tunnel)

Use this path if **any** of these are true:

- Your ISP uses CGNAT (no real public IP).
- Your ISP blocks inbound 80 and/or 443.
- You don't want to expose your home IP publicly.
- You want a stable Elastic IP regardless of ISP changes.

**How it works:** A tiny EC2 instance with an Elastic IP runs a reverse proxy (Caddy is easiest — auto-TLS). Route 53 points `gitlab.superluckyland.com` at the EC2's Elastic IP. The EC2 instance reaches the Mac mini over an outbound-initiated tunnel (Tailscale is simplest), so the Mac mini does **not** open any inbound ports.

```
Internet → Route 53 → EC2 Elastic IP (Caddy reverse proxy) → Tailscale tunnel → Mac mini :80/:2222
```

### 4.1 Cost estimate

- EC2 `t4g.nano` (ARM, on-demand): ~$3.40/month
- 1× Elastic IP attached to a running instance: free; if the instance is stopped, ~$3.60/month
- Data transfer out: $0.09/GB after first 100 GB/month free tier
- Tailscale free tier (up to 100 devices, 3 users): $0
- **Realistic total: $4–10/month** for a small instance with light traffic.

### 4.2 Set up Tailscale (do this first)

1. Sign up at https://tailscale.com (use a dedicated email or GitHub login you control).
2. Install Tailscale on the Mac mini: `brew install --cask tailscale` and sign in.
3. Note the Mac mini's Tailscale IP (e.g. `100.x.y.z`) from the Tailscale menubar app.

### 4.3 Launch the EC2 reverse proxy

1. AWS Console → **EC2** → **Launch instance**.
2. Name: `gitlab-proxy`.
3. AMI: **Ubuntu 24.04 LTS (arm64)**.
4. Instance type: **t4g.nano** (or `t4g.micro` for a bit more headroom).
5. Key pair: create or pick one — you'll SSH in to configure.
6. Network → Security group: create new with inbound rules:
   - 22/TCP from **your current IP only** (for SSH admin)
   - 80/TCP from anywhere
   - 443/TCP from anywhere
   - 2222/TCP from anywhere (for Git over SSH)
7. Storage: 8 GB gp3 is plenty.
8. **Launch.**
9. **Allocate an Elastic IP** and associate it with this instance. Note the EIP.

### 4.4 Install Tailscale on EC2

SSH in:

```bash
ssh -i ~/.ssh/<your-key>.pem ubuntu@<EIP>
```

Install Tailscale:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Sign in via the URL printed. Both EC2 and Mac mini are now on the same tailnet. Confirm:

```bash
tailscale status
ping <mac-mini-tailscale-ip>
```

### 4.5 Install Caddy on EC2

Caddy auto-issues Let's Encrypt certs and reloads on config edits.

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Write `/etc/caddy/Caddyfile`:

```caddy
gitlab.superluckyland.com {
    reverse_proxy <mac-mini-tailscale-ip>:80 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Reload:

```bash
sudo systemctl reload caddy
sudo journalctl -u caddy -f
```

### 4.6 Forward git-over-SSH through EC2

Caddy doesn't do SSH proxying; use plain TCP forwarding. Easiest: `socat` as a systemd unit.

`/etc/systemd/system/gitlab-ssh-proxy.service`:

```ini
[Unit]
Description=GitLab SSH TCP proxy to Mac mini
After=network.target tailscaled.service

[Service]
ExecStart=/usr/bin/socat TCP-LISTEN:2222,fork,reuseaddr TCP:<mac-mini-tailscale-ip>:2222
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo apt install -y socat
sudo systemctl daemon-reload
sudo systemctl enable --now gitlab-ssh-proxy
```

### 4.7 Update GitLab config on the Mac mini

Edit `gitlab.rb` (or `GITLAB_OMNIBUS_CONFIG`):

```ruby
external_url 'https://gitlab.superluckyland.com'
nginx['listen_port'] = 80
nginx['listen_https'] = false                        # Caddy on EC2 terminates TLS
nginx['real_ip_trusted_addresses'] = ['<EIP>']
nginx['real_ip_header'] = 'X-Real-IP'
nginx['real_ip_recursive'] = 'on'
letsencrypt['enable'] = false                        # Caddy handles certs
gitlab_rails['gitlab_shell_ssh_port'] = 22           # users see standard port in URLs
```

Run `docker exec -it gitlab gitlab-ctl reconfigure`.

Note that the SSH port published to users is `22` (the EC2 proxy listens on 2222 publicly but Caddy/Route 53/Git clients see the standard port via... well, this is the one snag — see 4.8).

### 4.8 Decide on SSH port for Git

You have two choices:

| Choice | Public SSH URL clients use | Trade-off |
|--------|---------------------------|-----------|
| Keep SSH on **2222** publicly | `git clone ssh://git@gitlab.superluckyland.com:2222/g/r.git` | No conflict with EC2's own admin SSH (which stays on 22) — simplest |
| Move EC2 admin SSH to a high port (e.g. 2200), let GitLab SSH use 22 | `git clone git@gitlab.superluckyland.com:g/r.git` | Cleaner URLs; one-time security-group + sshd_config change on EC2 |

If you pick the second, set `gitlab_rails['gitlab_shell_ssh_port'] = 22` and have `socat` listen on `:22` instead of `:2222`. Most users prefer this — the URLs match what GitHub/GitLab.com look like.

### 4.9 Route 53 for the pass-through

Change the A record:
- Name: `gitlab`
- Type: A
- Value: the **EC2 Elastic IP** (not your home IP)
- TTL: 300

### 4.10 Verify

```bash
curl -vI https://gitlab.superluckyland.com
ssh -T git@gitlab.superluckyland.com           # or with -p 2222 if you chose that
```

### 4.11 Hardening the EC2 hop

- Security group SSH (22 or the admin port you chose) restricted to your office IP **or** disabled entirely in favor of SSM Session Manager.
- Enable AWS automated patching (`unattended-upgrades` on Ubuntu).
- CloudWatch alarm on EC2 status check + an SNS topic to email you on failure.
- Snapshot the EBS volume nightly via Data Lifecycle Manager.
- Caddy logs to `/var/log/caddy/access.log` — ship to CloudWatch Logs if you want retention.
- Do **not** store the GitLab Tailscale IP in DNS or anywhere public; it should never be reachable except via tailnet.

---

## Part 5 — Choosing between Part 2 and Part 4

| Factor | Direct (Part 2) | EC2 pass-through (Part 4) |
|--------|-----------------|----------------------------|
| Cost | $0/month | $4–10/month |
| Setup time | 30–60 min | 1.5–3 hr |
| Works behind CGNAT? | No | Yes |
| Works if ISP blocks 80/443? | No | Yes |
| Hides home IP? | No | Yes |
| Survives ISP IP changes? | Only with DDNS (Part 3) | Yes — EIP doesn't change |
| Moving parts to patch | Router + Mac mini | Router + Mac mini + EC2 |

Start with Part 2 unless your pre-flight checks already rule it out.

---

## Part 6 — Credentials added by this work

Add these rows to `GitLab-credentials.md` once you've completed the public deployment:

| Credential | Where | Sensitivity |
|------------|-------|-------------|
| AWS root account password | AWS console | Critical |
| AWS root MFA seed + recovery codes | Authenticator + paper | Critical |
| IAM user `route53-ddns` access key (if Part 3) | `~/.aws/credentials` on Mac mini | High |
| EC2 SSH key (`gitlab-proxy.pem`) (if Part 4) | `~/.ssh/` | High |
| Tailscale account credentials (if Part 4) | tailscale.com login | High |
| Caddy/Let's Encrypt account email (if Part 4) | EC2 Caddyfile | Low |

---

## Part 7 — Final checklist

- [ ] Pre-flight checks complete (Part 1) — you know whether you have a real public IP and whether ports are open
- [ ] Route 53 A record for `gitlab.superluckyland.com` created and resolves correctly
- [ ] Router port forwards (Part 2) **or** EC2 + Tailscale + Caddy (Part 4) configured
- [ ] `external_url` in `gitlab.rb` set to `https://gitlab.superluckyland.com`
- [ ] TLS certificate issued (Let's Encrypt via GitLab, or Caddy on EC2)
- [ ] `https://gitlab.superluckyland.com` loads from a cellular/external network
- [ ] `git clone` and `ssh -T` both work from an external network
- [ ] DDNS configured (Part 3) if applicable
- [ ] New credentials added to `GitLab-credentials.md`
- [ ] Hardening (firewall on Mac mini, EC2 security group) reviewed
