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

If this app handles regulated data (health records, payment cards, etc.), stop and get compliance advice before following a generic guide — HIPAA/PCI have specific hosting requirements this document doesn't cover. (See Part 7 for a step-by-step guide to assessing that situation if it comes up later.)

### Note: all apps are browser-based

Since every app here is accessed through a browser rather than a native/desktop client, the setup below is actually simpler than it would otherwise be:

- Everything users need goes over standard web ports (80/443). There's no need to open or forward any app-specific ports — the reverse proxy (3.3) is the single front door for every app.
- One reverse proxy can host all your apps under different subdomains, each getting its own free HTTPS certificate automatically. You don't need a different setup per app.
- Because access is just "open a URL," the VPN-only option (3.5, Option A) works transparently — users just need the VPN connected before loading the page, no special client configuration per app.
- Session security becomes mostly an application concern: make sure each app sets cookies with `Secure`, `HttpOnly`, and `SameSite=Lax` (or stricter) attributes, and enforces HTTPS-only (no plain HTTP fallback). This matters more than usual since the reverse proxy is doing the TLS termination for you — the app itself may "think" it's running on plain HTTP internally, which is fine, but double check it isn't issuing cookies or redirects that assume `http://`.
- No need to worry about Windows at all — browser-based apps virtually never require a Windows server underneath. Part 2's Linux recommendation applies without exception now.

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

Use Linux. Since all apps here are browser-based, there's no scenario in this guide that requires Windows — that caveat only applies to legacy Windows-only backends (e.g., old .NET Framework apps), which doesn't describe anything you're building. Linux servers are lighter, more secure by default, and dominant for hosting web apps.

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

---

## Part 7: If HIPAA or PCI Gets Added to an App Later

This happens more often than people expect: an app starts as an internal tool, and later someone wants to add a field for a patient note (HIPAA) or a "pay your invoice here" button (PCI). Treat that as a trigger to stop and reassess — don't just keep building on the setup above. Here's how to work through it step by step.

### Step 1: Confirm whether you're actually in scope

Don't assume — check first, because "in scope" has a precise meaning for each framework:

- **HIPAA** applies if the app will create, store, process, or transmit PHI (Protected Health Information) — anything that ties health information to an identifiable person (name, DOB, MRN, etc.) — **and** you're a covered entity or business associate under HIPAA (e.g., you're building this for or with a healthcare provider, insurer, or clearinghouse, or you process PHI on their behalf).
- **PCI DSS** applies if the app will store, process, or transmit cardholder data (primary account number, expiration date, etc.) — "we take payments" is the trigger, even if you use a processor.

**Action:** Write down, specifically, what new data field or feature is driving this. If you genuinely can't avoid handling PHI or card data directly, continue to Step 2. If you can avoid it (see Step 2), that's usually the better outcome for a small team.

### Step 2: Ask whether you can offload the regulated part instead of becoming compliant yourself

This is the single highest-leverage decision, and most small teams get it wrong by trying to become compliant themselves when they don't have to:

- **For payments (PCI):** Never handle raw card numbers on your own server. Use a hosted payment processor (Stripe, Square, Braintree, etc.) with their hosted checkout page or client-side tokenization (e.g., Stripe Elements/Checkout). Done correctly, the card data never touches your server at all, and your PCI obligation drops to the lightest tier (SAQ A), which is mostly a short self-assessment questionnaire — not a hosting overhaul.
- **For health data (HIPAA):** Consider whether the sensitive processing/storage can live in a HIPAA-eligible managed cloud service (e.g., AWS/Azure/GCP services covered under their Business Associate Agreement) rather than on your on-prem box, even if the rest of the app stays on-prem. This is a legitimate, common architecture — "hybrid," not "all-or-nothing."

**Action:** Before touching your server config, see if you can route the regulated data path through a compliant third party instead of expanding what your on-prem box must satisfy. If yes, do that, and the rest of this guide's setup remains valid for the non-regulated parts of the app.

### Step 3: If you genuinely must host regulated data yourselves, get a Business Associate Agreement (BAA) or equivalent in place first

- For HIPAA: you cannot legally handle PHI as a business associate without a signed BAA with the covered entity (and with any subcontractor/vendor who will also touch that data — including your backup/cloud storage provider). Do not write a single line of code that touches PHI before this is signed.
- For PCI: review your merchant agreement with your acquiring bank/processor — they will specify which SAQ (Self-Assessment Questionnaire) type applies to your setup, which tells you exactly what's required.

**Action:** Stop and get these agreements signed, or a lawyer's confirmation they're not needed, before proceeding to Step 4. This is not optional paperwork — it's the mechanism that defines your legal obligations.

### Step 4: Get a qualified third party involved — don't DIY the compliance assessment

At this point, bring in outside expertise rather than relying on this guide or general internet research:

- **HIPAA:** Engage a HIPAA compliance consultant or firm to perform a formal Security Risk Assessment (required under the HIPAA Security Rule regardless of your size). This typically costs a few thousand dollars for a small environment and produces a concrete remediation list.
- **PCI:** If your SAQ type requires it (generally only larger merchants or specific integration types), engage a Qualified Security Assessor (QSA). For most small teams using a hosted payment page, you'll self-complete the applicable SAQ instead — but have someone who's done this before review your answers at least once.

**Action:** Get a quote and timeline from a consultant before committing to a launch date for the regulated feature. Compliance work is usually the long pole, not the engineering.

### Step 5: Expect these specific hosting changes versus the base setup in this guide

If Steps 2-4 confirm you must host regulated data on your own infrastructure, the baseline setup in this guide needs to change in at least these ways:

- **Encryption at rest:** Full-disk encryption (LUKS on Linux) becomes mandatory, not optional, for any drive holding regulated data, including backup drives.
- **Access logging:** You need an audit trail of who accessed what regulated record and when — this is an application-level requirement (most frameworks have libraries for this), not just server logs.
- **Network segmentation:** The server (or at least the regulated-data path) typically needs to be isolated on its own network segment/VLAN, separate from general office traffic — the single flat home-office network implied in Part 3 is no longer sufficient.
- **Backup/vendor agreements:** Any backup destination, cloud storage, or third-party service that touches the regulated data needs its own BAA (HIPAA) or PCI attestation — re-check every tool named in Part 4 (Backblaze, restic's defaults, etc.) against this requirement.
- **Multi-factor authentication:** Becomes mandatory (not just recommended) for all administrative access, and likely for end-user login to the regulated app as well.
- **Formal incident response plan:** You need a written plan for what happens if there's a breach, including notification obligations (HIPAA breach notification rules have specific timelines).
- **Physical security:** HIPAA in particular expects documented physical safeguards around the server itself (locked room/cabinet, access logging for who entered the space) — "a closet anyone in the office can walk into" will not pass an assessment.

**Action:** Treat this as a checklist to hand to the consultant from Step 4, not something to implement solo from this summary — the specifics depend on your exact data flows and the assessment's findings.

### Summary flow

1. Confirm you're actually in scope (don't guess).
2. Try to offload the regulated data path to a compliant third party first — this avoids most of the rest.
3. Get a BAA / confirm your SAQ type before writing any code that touches the data.
4. Bring in a qualified assessor/consultant — don't self-certify from a blog post.
5. Only then adjust your hosting setup, using their findings as the actual spec, with the changes in Step 5 as a preview of what's likely coming.

---

## Part 8: Migrating Off This Server Later (New Hardware or Cloud)

Every server eventually gets migrated — hardware ages out, you outgrow it, or you decide to move to a cloud provider. The good news: if you followed Parts 3 and 4 above (Docker containers + disciplined backups), you already did most of the hard work. Migration is mostly "restore your backups somewhere else," not a rebuild from scratch. Here's the step-by-step plan either way.

### Step 1: Decide the destination and get it provisioned

Don't start copying data until the destination exists and is reachable.

- **New on-prem hardware:** Buy/rack the new server, install the same OS (Part 2) on it, and get it on the network with its own fixed IP (3.1). Don't reuse the old server's IP yet — see Step 6.
- **Cloud service:** Decide between a cloud VM (e.g., a plain virtual machine on AWS/Azure/GCP/DigitalOcean where you still manage the OS yourself — closest to what you have now) versus a managed platform (e.g., a managed container service or PaaS where the provider handles the OS). For a team that just went through this guide, a cloud VM is the gentler move: the Docker-based setup from Part 3.4 transfers almost unchanged. A managed PaaS is less maintenance long-term but means re-learning a new deployment model — treat that as a separate, later decision rather than bundling it into this migration.

**Action:** Provision the destination, confirm you can SSH into it (or access its console), and apply the same baseline hardening from Part 2.3 and Part 3.2 (updates, firewall, non-root user, SSH keys) before anything else moves there.

### Step 2: Inventory everything that actually needs to move

Write down every component currently running on the old server, so nothing gets forgotten. For a typical setup from this guide, that's:

- The `docker-compose.yml` file(s) and any associated config files (Caddyfile, `.env` files, etc.).
- Named Docker volumes / bind-mount directories holding app data and uploaded files.
- The database and its current data.
- Any cron jobs or scheduled scripts (`crontab -l` for your user and `sudo crontab -l` for root).
- TLS/HTTPS certificates (if not using Caddy's automatic renewal, which re-issues on the new box anyway).
- The WireGuard VPN config (if using Option A from Part 3.5) — server keys and the per-user peer configs.
- DNS records pointing at the old server's IP, and anywhere its IP or hostname is hardcoded (app config, scripts, documentation).

**Action:** Turn this into a literal checklist file before you touch anything — this becomes your cutover checklist in Step 5.

### Step 3: Do a full "cold" test migration before touching production

Don't migrate the live system on your first attempt. Practice on a copy first:

1. Take a fresh backup of everything using the process already in Part 4.
2. Restore that backup to the new server (or a throwaway cloud VM if testing a cloud move) while the old server keeps running normally.
3. Bring the app up on the new server using a different hostname/port, log in, click through its core functions, and confirm the data looks correct and complete.
4. Note anything that broke or needed manual fixing — fix the process, not just the instance, so the real cutover goes smoothly.

**Action:** Repeat this trial restore until it works cleanly without manual patching. This also happens to be the same exercise as your quarterly backup-restore test from Part 4.2 — if you've been doing that already, you're most of the way there.

### Step 4: Plan the cutover window

Pick a low-traffic time (evening/weekend for a 9-to-5 internal tool) and tell your users in advance: what's happening, how long it should take, and what they'll see (e.g., "the app will be unreachable from 6-7 PM").

**Action:** Block time on the calendar, and prepare a short status message you can send if it runs long, so people aren't left guessing.

### Step 5: Execute the real migration

1. Put the old app in maintenance mode if possible, or stop accepting new writes (e.g., `docker compose stop app` while leaving the database briefly available for a final dump).
2. Take one last, final backup/export of the database and any data volumes — this is the copy that will actually go live, not the one from Step 3.
3. Transfer it to the new server (`rsync` over SSH, or restore from the off-site backup location directly).
4. Bring the stack up on the new server (`docker compose up -d`), restore the database from the final dump, and restore the WireGuard config / TLS setup from your Step 2 inventory.
5. Test thoroughly on the new server using its temporary address before any DNS/user-facing change.

### Step 6: Cut traffic over

- Update DNS records to point at the new server's address (for cloud destinations) or update your router's port-forwarding/DHCP reservation to the new machine (for new on-prem hardware).
- If using VPN-only access, distribute updated VPN peer configs if the server's public endpoint changed, and test connectivity yourself before telling anyone else to reconnect.
- Expect DNS changes to take a little time to propagate everywhere; keep the old server running and unchanged (but not accepting writes) for a day or two as a fallback.

**Action:** Have one colleague test full end-to-end access (VPN connect → load app → log in → do a real task) from outside your office network before declaring the migration done.

### Step 7: Decommission the old server properly

Once the new server has run cleanly for a few days with no issues reported:

- Take one final backup of the old server as an archive, and confirm it's stored somewhere safe (just in case).
- Securely wipe the old server's drives before disposing, reselling, or repurposing it (regulated data, if any, makes this mandatory — see Part 7 — but it's good practice regardless). A simple full-disk overwrite (e.g., `shred` or the drive's built-in secure-erase) is sufficient for most on-prem hardware; physically destroy drives instead if the data was ever in scope for HIPAA/PCI.
- Update your Part 5.4 documentation file with the new server's details — IP, specs, what's running, backup locations — so it reflects reality again.
- Cancel/reclaim anything tied to the old box specifically (static IP reservation, UPS pairing, monitoring alerts pointed at the old address).

### A note on moving to a managed cloud platform specifically

If the destination is a managed PaaS rather than a cloud VM (i.e., you're giving up direct OS access in exchange for the provider managing more of the stack), steps 1-4 of this plan still apply, but step 5 changes: instead of restoring Docker Compose onto a bare OS, you'll be adapting your container definitions to that platform's deployment format (most support standard Dockerfiles with minor tweaks). Budget extra time for this translation step and test it thoroughly during Step 3's cold migration rather than discovering platform-specific quirks during the real cutover.
