---
title: GitLab Mac mini — Credentials Inventory
date: 2026-05-26
companion_doc: Gitlab-install.md
storage_recommendation: Use a single shared password manager (1Password, Bitwarden, etc.) with a "Mills GitLab" vault. Every row below is a separate entry in that vault.
---

# GitLab Credentials Inventory

Every credential listed below must be created, received, or rotated as part of the Mac mini GitLab install. Treat the **Sensitivity** column literally: *Critical* items mean a single leak compromises the whole instance.

| # | Credential | Where it lives | Who creates it | When | Rotation cadence | Sensitivity | Notes |
|---|------------|----------------|----------------|------|------------------|-------------|-------|
| 1 | **macOS admin account password** (`gitlab-admin`) | Mac mini login | You, at OS setup | Pre-install | 12 months | Critical | Dedicated account; not your daily user |
| 2 | **macOS FileVault recovery key** | Apple ID or printable PDF | macOS, at FileVault enablement | Pre-install | On loss only | Critical | Store in a fireproof location, not only in the password manager on the same Mac |
| 3 | **Mac firmware / Recovery Lock password** | EFI (Intel) or Apple ID (Apple Silicon) | You | Pre-install | On hardware change | High | Prevents Recovery Mode tampering |
| 4 | **Router / firewall admin password** | Network device | You | Pre-install | 12 months | High | Needed for port forwards and DHCP reservation |
| 5 | **Domain registrar / DNS provider login** | Provider site | You | Pre-install | 12 months + MFA | High | Required to point `gitlab.example.com` at the Mac mini |
| 6 | **Dynamic DNS service credentials** (if home/ISP IP) | e.g. Cloudflare, Dynu | You | Pre-install | 12 months | Medium | Skip if you have a static public IP |
| 7 | **Docker Hub account** (optional) | hub.docker.com | You | Pre-install | 12 months + MFA | Low | Only needed for higher pull limits or private images |
| 8 | **GitLab initial root password** | `/etc/gitlab/initial_root_password` inside container | GitLab, on first boot | Day 1 | Replace immediately | Critical | Auto-deletes 24 h after first restart — retrieve and store within minutes |
| 9 | **GitLab `root` user password (replacement)** | GitLab DB | You, day 1 | Day 1 | 6 months | Critical | Set right after first login; then demote/disable `root` once a personal admin exists |
| 10 | **GitLab root 2FA seed + recovery codes** | Authenticator app + paper backup | You, day 1 | Day 1 | On device loss | Critical | Print the recovery codes; store offline |
| 11 | **Personal admin user password** | GitLab DB | You, day 1 | Day 1 | 6 months | Critical | This becomes the day-to-day admin account |
| 12 | **Personal admin 2FA seed + recovery codes** | Authenticator + paper backup | You, day 1 | Day 1 | On device loss | Critical | Same handling as #10 |
| 13 | **SMTP relay username + password** | `gitlab.rb` (`smtp_user_name`, `smtp_password`) | SMTP provider | Day 1 | 12 months | High | Needed for password resets, notifications, 2FA setup emails |
| 14 | **TLS private key** (`gitlab.mills.local.key` or Let's Encrypt key) | `$GITLAB_HOME/config/ssl/` | OpenSSL/Let's Encrypt/CA | Day 1 | 90 d (LE) or per CA | Critical | Never check into git; key file is mode 600 |
| 15 | **TLS certificate** (matching #14) | `$GITLAB_HOME/config/ssl/` | Same as #14 | Day 1 | 90 d (LE) or per CA | Medium | Public material but still version-tracked carefully |
| 16 | **`gitlab-secrets.json`** | `$GITLAB_HOME/config/gitlab-secrets.json` | GitLab, on first reconfigure | Day 1 | Rotate if exposed | Critical | DB encryption keys live here — back up off-host with the data dump |
| 17 | **Backup encryption passphrase** | Your backup tool (e.g. `gpg`, `restic`, Time Machine FileVault) | You | Day 1 | 12 months | Critical | Backups must be encrypted before leaving the Mac mini |
| 18 | **Off-site backup destination credentials** (S3, Backblaze B2, etc.) | Provider console | You | Week 1 | 6 months + MFA | High | Use a least-privilege bucket/IAM user dedicated to GitLab backups |
| 19 | **PostgreSQL `gitlab` DB password** | Auto-managed in `gitlab-secrets.json` | GitLab | Day 1 | N/A (managed) | Critical | Bundled Postgres; you almost never touch this unless you go external |
| 20 | **Redis password** | Auto-managed in `gitlab-secrets.json` | GitLab | Day 1 | N/A (managed) | High | Same as above — bundled |
| 21 | **GitLab Runner registration token** | Admin → CI/CD → Runners | You generate, runners present | Week 2 | Rotate on runner change | High | One token per runner scope; treat as a secret |
| 22 | **Webhook secret tokens** (per webhook) | Project → Settings → Webhooks | You, per integration | Ongoing | On integration change | Medium | Validates inbound webhook auth |
| 23 | **Personal Access Tokens (PATs)** | Per user | Each user | Ongoing | ≤ 90 d expiry | High | Scope minimally; expire aggressively; block long-lived PATs |
| 24 | **Deploy keys / Deploy tokens** | Per project | Project maintainer | Ongoing | On deploy target change | High | Read-only by default; never reuse across projects |
| 25 | **OAuth / SAML SSO client secret** | IdP + GitLab `gitlab.rb` | IdP admin | If SSO enabled | 12 months | High | Only needed if you wire up Google/Okta/Azure AD |
| 26 | **GitLab Enterprise license key** | Admin → Subscription | GitLab Sales | If EE | At renewal | Medium | Skip if running Community Edition |
| 27 | **Container Registry signing / pull secret** | Per project / CI variable | Project maintainer | If Registry enabled | 6 months | Medium | Only if you turn the Container Registry on |
| 28 | **Password manager master password** | Your password manager | You | Pre-install | 12 months | Critical | Everything above only matters if this is strong and unique |

## Handling rules

- **Never** commit credentials into a GitLab repo — even on this self-hosted instance.
- Every Critical/High row above gets its own password-manager entry with: value, URL, owner, rotation date, recovery info.
- 2FA recovery codes (#10, #12) are printed and stored physically; password-manager-only is a single point of failure.
- `gitlab-secrets.json` (#16) is included in every backup bundle and stored encrypted (#17) off-host.
- When a person with admin access leaves the team, rotate items 9, 11, 13, 18, 21, 23 within 24 hours.
- Maintain a rotation calendar — items with a fixed cadence should have reminders set the day the credential is created.
