---
prompt: |
  I and my colleagues are creating SaaS apps that we would like to host on-prem. Typical number of concurrent users would be 10, and total number of users with access would never exceed 500. Create a plain engkist, step-by-step guide that embodies best practices for specifying hardware and OS, configuring the system, maintenance, and security. Write for an absolute beginnner, filling in any gaps in assumptions. Prepend this prompt with the model info, and save to 26-10-local-server.md.
model: claude-sonnet-5
date: 2026-11-01
---

# Hosting Your SaaS App On-Prem: A Beginner's Guide

## Assumptions (filling the gaps)

Since you didn't specify, here's what this guide assumes. If any of these are wrong, the plan changes, so flag it:

- You're hosting one or a handful of small-to-medium web applications (the kind of thing you'd normally put on Heroku or a small cloud VM).
- "Concurrent users: 10, total: 500" means light load — this is not a high-traffic consumer app. A single, well-specified server can handle this comfortably.
- You want this running in an office, closet, or similar space you control — not a proper data center with redundant power/cooling.
- You have no existing IT staff dedicated to this; "beginner" means you're the one who'll run it.
- Uptime matters (people need to use the app during work hours) but you can tolerate a short outage for maintenance, i.e., this isn't life-safety or financial-transaction critical.
- Remote access is needed (at least some of your 500 users aren't walking up to the physical machine).

If this app handles regulated data (health records, payment cards, etc.), stop and get compliance advice before following a generic guide — HIPAA/PCI have specific hosting requirements this document doesn't cover.

---

## Part 1: Specifying Hardware

### 1.1 Do the math on what you actually need

10 concurrent users running typical web-app workloads (forms, dashboards, some database queries) is a small load. You do not need enterprise server hardware. Most failures at this scale come from under-speccing disk and RAM for the database, not CPU.

**Recommended minimum spec for a single server running everything:**

- **CPU:** 4-8 cores (modern, e.g., AMD Ryzen or Intel Xeon/Core, anything from the last 3-4 years). You won't be CPU-bound at this scale.
- **RAM:** 32 GB. This sounds generous for 10 users, but RAM is cheap and it's what you'll miss first if you add a second app, a database cache, or more users later.
- **Storage:** Two drives, not one:
  - A fast SSD (NVMe if possible) for the OS and application — 500 GB is plenty.
  - A second drive (SSD or HDD) for backups, separate from the OS drive, so a backup failure doesn't take down the live system.
- **Network:** Standard gigabit Ethernet is sufficient. Avoid Wi-Fi for a server — always wired.
- **Power supply:** Get a model with redundant power if your budget allows, but it's not essential at this scale. What *is* essential: a UPS (uninterruptible power supply) — see 1.3.

### 1.2 Buy a real server, not a repurposed desktop

A desktop PC will technically work, but avoid it if you can. Real server hardware (e.g., Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem — entry-level tower or 1U rack models) gives you:

- Remote management (a separate network port that lets you power-cycle or reinstall the OS even if the main OS is broken) — called iDRAC (Dell), iLO (HPE), or IMM/XCC (Lenovo).
- Hot-swappable drives (replace a failing disk without powering off).
- ECC RAM (error-correcting memory — catches and fixes small memory errors before they corrupt data).

Entry-level tower servers from these vendors in the spec above typically cost $1,500-$3,000 new. This is worth it over a repurposed gaming PC for anything people depend on for work.

### 1.3 Buy a UPS

A UPS is a battery backup that sits between the wall outlet and your server. Get one rated for at least 15-20 minutes of runtime at your server's power draw (a basic 1000-1500VA unit from APC or CyberPower is typically enough for one small server). This protects against:

- Power blips corrupting your database mid-write.
- A storm knocking out power while someone is mid-task.

Configure it (see Part 2) to tell the server to shut down gracefully if the battery gets low, rather than just dying.

### 1.4 Plan for redundancy later, not now

At 10 concurrent / 500 total users, a single well-backed-up server is appropriate. Don't buy a second "failover" server yet — it adds complexity you don't need at this scale. Revisit this if downtime becomes genuinely costly to the business.

---

## Part 2: Choosing and Installing the OS

### 2.1 Pick a server Linux distribution

Use Linux, not Windows, unless your app specifically requires Windows (e.g., a .NET Framework app that isn't on .NET Core/5+). Linux servers are lighter, more secure by default, and dominant for hosting web apps.

Recommended: **Ubuntu Server LTS** (currently 24.04 LTS as of this writing, or whatever the newest LTS is when you buy). Reasons for a beginner:

- "LTS" = Long Term Support — 5 years of security updates, so you're not forced to upgrade the OS constantly.
- Huge community, so any error message you paste into a search engine has an answer.
- Most SaaS tooling (Docker, Postgres, Nginx, etc.) documents Ubuntu explicitly.

Alternative if you want something even more stable/conservative: **Debian Stable**. Slightly more manual setup, slightly more "boring and reliable." Either is a fine choice.

Avoid: Windows Server (unless required), rolling-release distros (Arch, Fedora) — too much unplanned change for a system you want to leave alone.

### 2.2 Install the OS

1. Download the Ubuntu Server LTS ISO from ubuntu.com.
2. Write it to a USB drive (use a tool like balenaEtcher or Rufus on another computer).
3. Boot the server from the USB drive (usually F11/F12/Del at startup to pick boot device — varies by vendor).
4. During install:
   - Choose a **minimal** install (don't install a desktop GUI — servers run "headless," controlled via terminal).
   - Set up disk partitioning with LVM (the installer offers this as a guided option) — this lets you resize partitions later without reinstalling.
   - Create a non-root user account for yourself with a strong password. Do not plan to log in as `root` day-to-day.
   - Enable OpenSSH server when prompted — this is how you'll administer the machine remotely afterward.
   - Skip installing extra "snaps"/applications during install; you'll install only what you need later.
5. Reboot, remove the USB drive.

### 2.3 First login and basic hardening

SSH in from your own computer (`ssh yourusername@server-ip-address`), then:

1. Update everything immediately:
   ```
   sudo apt update && sudo apt upgrade -y
   ```
2. Set the hostname to something identifiable:
   ```
   sudo hostnamectl set-hostname appserver01
   ```
3. Set the correct timezone:
   ```
   sudo timedatectl set-timezone America/New_York
   ```
   (replace with your actual timezone — correct timestamps matter enormously for debugging and logs later)
4. Enable automatic security updates:
   ```
   sudo apt install unattended-upgrades -y
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

---

## Part 3: Configuring the System

### 3.1 Give the server a fixed (static) IP address

If the server's address changes, nothing can reliably find it. On your router, reserve a fixed internal IP for the server's network card (MAC address) via DHCP reservation — this is easier and safer than configuring a static IP by hand on the Linux side, and it's done through your router's admin page.

### 3.2 Set up a firewall

Ubuntu ships with `ufw` (uncomplicated firewall). Default-deny everything, then explicitly allow what you need:

```
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

Only open additional ports if a specific service genuinely needs to be reached directly from outside.

### 3.3 Install a reverse proxy

Don't expose your application directly to the internet. Put **Nginx** (or Caddy, which is simpler for beginners) in front of it. The reverse proxy:

- Terminates HTTPS/TLS (handles the encryption, so your app doesn't have to).
- Can serve multiple apps on one server under different subdomains (app1.yourcompany.com, app2.yourcompany.com).
- Shields your actual application process from direct exposure.

Install Caddy (simplest option — it gets free HTTPS certificates automatically):
```
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```
Then point a Caddyfile (`/etc/caddy/Caddyfile`) at your app, e.g.:
```
app.yourcompany.com {
    reverse_proxy localhost:3000
}
```
Caddy will automatically obtain and renew a valid HTTPS certificate for you via Let's Encrypt — provided the domain's DNS points at your server and port 443 is reachable from the internet (see 3.5 on exposure).

### 3.4 Run your application in containers

Use **Docker** so your application, its dependencies, and its exact versions are packaged together, reproducible, and isolated from the host OS:

```
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER
```
(log out and back in after the usermod command)

Define your app(s) and database in a `docker-compose.yml` file. This also makes moving to new hardware later trivial — copy the compose file and data volumes to the new box.

### 3.5 Decide how the server is exposed to the internet

This is the most consequential decision in the whole setup, so make it deliberately:

- **Option A — VPN-only access (recommended for 500 internal users):** Don't expose the app to the public internet at all. Set up a VPN (WireGuard is modern and simple: `sudo apt install wireguard`) and require users to connect to the VPN before they can reach the app. This drastically shrinks your attack surface.
- **Option B — Public HTTPS with authentication:** If users need access from anywhere without a VPN client, expose only ports 80/443 through your router (port-forwarding) to the server, and ensure the application itself has strong login/authentication. This is more convenient but means the whole internet can reach your login page, so it needs more hardening (rate limiting, fail2ban — see 5.3).

Given your user count and that this sounds like an internal business tool, **Option A (VPN) is the better default** unless you have a specific reason users need unauthenticated-network access.

### 3.6 Set up your router correctly

- Change the router's default admin password immediately if you haven't.
- If using Option B, forward only ports 80 and 443 to the server's fixed internal IP — nothing else.
- If using Option A, forward only the WireGuard UDP port (commonly 51820).

---

## Part 4: Backups

Backups are not optional, and "RAID is not a backup" — RAID (if you use it) protects against a drive failing, not against you deleting the wrong database table or ransomware encrypting everything.

### 4.1 Follow the 3-2-1 rule

- **3** copies of your data total.
- On **2** different types of media/storage.
- **1** copy off-site (physically elsewhere, or cloud storage).

### 4.2 Practical setup

1. Nightly automated database dump + app data backup to the second internal drive (see 1.1).
2. Sync that backup off-site nightly — either to a cloud object storage bucket (Backblaze B2 is cheap and simple) using a tool like `restic` or `rclone`, or to a drive at another physical location.
3. Encrypt backups before they leave the building (`restic` does this natively).
4. **Test restores quarterly.** An untested backup is a hope, not a backup. Actually restore it to a spare machine or a temporary directory and confirm the data is intact and usable.

---

## Part 5: Maintenance

### 5.1 Patch on a schedule

- Unattended-upgrades (set up in 2.3) handles most security patches automatically.
- Once a month, manually log in and run `sudo apt update && sudo apt upgrade` and reboot if a kernel update is pending (`sudo reboot` — schedule it for off-hours).
- Check for Docker image updates for your app's base images periodically; stale base images accumulate unpatched vulnerabilities even if the OS itself is current.

### 5.2 Monitor the basics

You don't need an enterprise monitoring stack at this scale, but you do need to know if the server is dying before your users tell you. Minimum viable monitoring:

- Disk space: set up a simple cron job or use a free tier of an external uptime service (e.g., UptimeRobot) to ping your app's URL every few minutes and email/text you if it's down.
- Install `htop` and check in occasionally, or set up Netdata (`sudo apt install netdata` isn't quite right — follow the install script at netdata's site) for a free, simple real-time dashboard you can check from a browser.

### 5.3 Log review and intrusion detection

- Install `fail2ban` — it automatically blocks IPs that repeatedly fail login attempts (SSH, and your app's login if configured):
  ```
  sudo apt install fail2ban -y
  ```
- Periodically skim `/var/log/auth.log` for repeated failed SSH logins from unfamiliar IPs (should be rare if fail2ban and the firewall are working).

### 5.4 Document what you built

Keep a simple text file (stored off the server, e.g., in a password manager's secure note or a private repo) listing: server IP, what's installed and why, where backups go, VPN config location, and admin credentials' location (not the credentials themselves — use a password manager for those). Future-you, or a colleague covering for you, will need this.

---

## Part 6: Security Checklist (Summary)

- [ ] SSH key-based login only; disable password-based SSH login once key access is confirmed working (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
- [ ] Firewall (`ufw`) default-deny, only necessary ports open.
- [ ] No direct exposure of the app — reverse proxy + HTTPS, or VPN-only access.
- [ ] Automatic security updates enabled.
- [ ] fail2ban running.
- [ ] Backups: automated, encrypted, off-site, 3-2-1, and *tested*.
- [ ] UPS connected and configured to trigger graceful shutdown.
- [ ] Non-root admin account with sudo; root login disabled over SSH (`PermitRootLogin no`).
- [ ] Strong, unique passwords (password manager), and multi-factor authentication on anything exposed to the internet (router admin, VPN, cloud backup account).
- [ ] A written record of what's on the server and how to restore it.

---

## A note on scope

This guide gets you to "a solid, secure, maintainable single-server setup appropriate for ~500 registered / ~10 concurrent users." If any of the following become true, revisit the architecture rather than just scaling this setup up: you need guaranteed high availability (no acceptable downtime), you're handling regulated data, your user count grows by an order of magnitude, or you need geographically distributed access with low latency everywhere. Those scenarios call for a different conversation.
