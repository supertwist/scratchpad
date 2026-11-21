# macOS LaunchD: Auto-Starting Services on Boot

Documentation for configuring services to automatically start when your Mac boots, with examples for Ollama, N8N, and Crawl4AI.

---

## Status: Which Services Auto-Start?

| Service | Auto-Start | Status | Location |
|---------|-----------|--------|----------|
| **Crawl4AI** | ✅ Yes | Running | `~/.opencode/mcp_crawl4ai_server.py` via Python |
| **Ollama** | ✅ Yes (newly added) | Running | `/usr/local/bin/ollama serve` |
| **N8N** | ✅ Yes (newly added) | Running | `/opt/homebrew/bin/n8n start` |

All three services now have launchd configurations and will start automatically on boot.

---

## How LaunchD Works

**LaunchD** is macOS's service management system (similar to `systemd` on Linux).

### Key Concepts

1. **Plist file** — Property list (XML) file that describes a service
   - Located in `~/Library/LaunchAgents/` (user services, run as your user)
   - Or `/Library/LaunchDaemons/` (system services, run as root)

2. **Label** — Unique identifier for the service (e.g., `local.ollama`)
   - Used in commands like `launchctl list local.ollama`
   - Convention: `local.servicename` for personal services

3. **RunAtLoad** — `<true/>` means start this service when launchd loads
   - Set to `<true/>` for auto-start on boot

4. **KeepAlive** — `<true/>` means restart if the process crashes
   - Essential for background services

5. **ThrottleInterval** — Minimum seconds between restart attempts (default restart delay)
   - Prevents rapid restart loops if service keeps crashing

6. **StandardOutPath / StandardErrorPath** — Log file locations
   - Logs all stdout/stderr to these files for debugging

---

## The Three Service Configurations

### 1. Crawl4AI (Python script)

**File:** `~/Library/LaunchAgents/local.crawl4ai.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>local.crawl4ai</string>

    <key>ProgramArguments</key>
    <array>
        <string>/Library/Frameworks/Python.framework/Versions/3.11/bin/python3</string>
        <string>/Users/james/GIT/ollama-browser/start_crawl4ai.py</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/james/GIT/ollama-browser</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>StandardOutPath</key>
    <string>/Users/james/Library/Logs/crawl4ai.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/james/Library/Logs/crawl4ai.log</string>
</dict>
</plist>
```

**Key points:**
- Uses explicit Python path (required for scripts)
- Sets `WorkingDirectory` for the script to find relative imports
- Logs to `~/Library/Logs/crawl4ai.log`

---

### 2. Ollama (Binary)

**File:** `~/Library/LaunchAgents/local.ollama.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>local.ollama</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ollama</string>
        <string>serve</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>StandardOutPath</key>
    <string>/Users/james/Library/Logs/ollama.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/james/Library/Logs/ollama.log</string>
</dict>
</plist>
```

**Key points:**
- Simple binary + command argument (`serve`)
- No `WorkingDirectory` needed (binary knows where to find its data)
- Logs to `~/Library/Logs/ollama.log`

---

### 3. N8N (Binary)

**File:** `~/Library/LaunchAgents/local.n8n.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>local.n8n</string>

    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/n8n</string>
        <string>start</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>StandardOutPath</key>
    <string>/Users/james/Library/Logs/n8n.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/james/Library/Logs/n8n.log</string>
</dict>
</plist>
```

**Key points:**
- N8N binary with `start` subcommand
- Logs to `~/Library/Logs/n8n.log`

---

## How to Add a New Service (Template)

### Step 1: Find the executable

```bash
which my-service
# Example: /opt/homebrew/bin/my-service
# Or for Python: /usr/local/bin/python3 /path/to/script.py
```

### Step 2: Determine the startup command

```bash
# Binary with no args
my-service

# Binary with args
my-service serve
my-service start

# Python script
python3 /path/to/script.py
```

### Step 3: Create the plist file

```bash
cat > ~/Library/LaunchAgents/local.my-service.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>local.my-service</string>

    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/my-service</string>
        <string>serve</string>
    </array>

    <!-- If Python script, add WorkingDirectory: -->
    <key>WorkingDirectory</key>
    <string>/path/to/script/directory</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>StandardOutPath</key>
    <string>/Users/james/Library/Logs/my-service.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/james/Library/Logs/my-service.log</string>
</dict>
</plist>
EOF
```

### Step 4: Load the service

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/local.my-service.plist
```

### Step 5: Verify

```bash
# Check if loaded
launchctl list | grep local.my-service

# Check logs
tail -f ~/Library/Logs/my-service.log

# Test the service endpoint
curl http://127.0.0.1:PORT/health  # or appropriate endpoint
```

---

## Common LaunchD Operations

### List all user services

```bash
launchctl list | grep local.
```

**Output columns:**
- PID (process ID)
- Exit code (0 = running, negative = crash code)
- Label (service name)

### Check service status

```bash
launchctl list local.ollama
# Shows: PID, exit code, label
```

### View service logs

```bash
# Real-time follow
tail -f ~/Library/Logs/my-service.log

# Last 50 lines
tail -50 ~/Library/Logs/my-service.log
```

### Reload a service (after editing plist)

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/local.my-service.plist
```

### Stop a service temporarily

```bash
launchctl stop local.my-service
# Service will restart on boot (KeepAlive is true)
```

### Disable a service (remove from auto-start)

```bash
launchctl bootout gui/$UID ~/Library/LaunchAgents/local.my-service.plist
# Service will NOT start on boot; can still start manually
```

### Remove a service entirely

```bash
launchctl bootout gui/$UID ~/Library/LaunchAgents/local.my-service.plist
rm ~/Library/LaunchAgents/local.my-service.plist
```

### Restart a service

```bash
launchctl stop local.my-service
# Wait for automatic restart (KeepAlive=true), or manually start:
launchctl start local.my-service
```

---

## Troubleshooting

### Service won't start

**Check logs:**
```bash
tail -50 ~/Library/Logs/my-service.log
```

**Common issues:**
1. **Incorrect executable path** — Use `which` to verify
2. **Missing dependencies** — Script needs Python, Node, etc.
3. **Wrong working directory** — Python scripts can't find imports
4. **Permissions** — File must be readable/executable

### Service keeps crashing

**Check exit code:**
```bash
launchctl list local.my-service
# If negative exit code (e.g., -9), service crashed
```

**Check logs for error messages:**
```bash
tail -100 ~/Library/Logs/my-service.log
```

**Solutions:**
- Fix the underlying issue (see logs)
- Increase `ThrottleInterval` to give it more time between restarts
- Try running manually to see the error:
  ```bash
  /opt/homebrew/bin/my-service serve
  ```

### Service loads but doesn't start

**Check if plist is valid:**
```bash
plutil -lint ~/Library/LaunchAgents/local.my-service.plist
```

**Force reload:**
```bash
launchctl bootout gui/$UID ~/Library/LaunchAgents/local.my-service.plist
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/local.my-service.plist
```

---

## Why LaunchD Over Other Methods?

| Method | Pros | Cons |
|--------|------|------|
| **LaunchD (plist)** | Native to macOS, handles crashes, auto-restart, logs, permissions | XML is verbose; plist editing required |
| **Shell profile (~/.zshrc)** | Simple, no extra files | Doesn't work if shell isn't opened; no crash recovery |
| **Homebrew services** | Wrapper around launchd, easier syntax | Still uses launchd under the hood |
| **Supervisor/systemd** | Cross-platform (Linux) | Not native to macOS; overkill for single Mac |

**Recommendation:** Use LaunchD for all background services on macOS.

---

## Verification: Current Stack

As of 2026-11-21, your local stack:

```
Boot
  ↓
  ├─ Ollama (launchd)
  │   └─ Listens on http://127.0.0.1:11434
  │   └─ Loads models into memory
  │
  ├─ N8N (launchd)
  │   └─ Listens on http://127.0.0.1:5678
  │   └─ Loads workflows
  │
  └─ Crawl4AI (launchd via Python)
      └─ Listens on http://127.0.0.1:8000
      └─ Scrapes DuckDuckGo
```

**Result:** All three start automatically on Mac boot. No manual startup needed.

---

## Next Steps

If you add more services (PostgreSQL, Redis, Meilisearch, etc.):
1. Use the template above
2. Find the binary with `which`
3. Test the startup command manually
4. Create the plist
5. Load with `launchctl bootstrap`

For debugging, always check:
- `launchctl list | grep local.`
- `tail -f ~/Library/Logs/service-name.log`
- Run the command manually to see errors

---

**Created:** 2026-11-21  
**Updated:** 2026-11-21
