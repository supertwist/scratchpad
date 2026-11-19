# LiteLLM + Ollama + Web Browsing Setup Guide

**Difficulty Level: Medium** (more complex than N8N, but simpler than custom coding)

---

## Overview

LiteLLM is a proxy server that sits between your Ollama server and your clients (Discord bot, desktop app, etc.). It intercepts queries, can add web search capabilities, and passes responses back to any interface.

**Architecture:**
```
Discord Bot / Desktop App / Any Client
           ↓
      LiteLLM Proxy (localhost:3000)
           ↓
      Ollama Server (localhost:11434)
           ↓
      Your Browser / Web Tools (optional)
```

---

## Prerequisites

You need these already installed/running:
- **Ollama** running locally (listening on `localhost:11434`)
- **Python 3.8+** installed on your machine
- **pip** (Python package manager)
- A model running in Ollama (e.g., `ollama pull mistral` or similar)

**Check:**
```bash
# Ollama is running
curl http://localhost:11434/api/tags

# Python is installed
python3 --version

# pip is installed  
pip3 --version
```

---

## Step 1: Install LiteLLM

```bash
# Install LiteLLM via pip
pip3 install litellm
```

**Check installation:**
```bash
litellm --version
```

---

## Step 2: Create a Configuration File

LiteLLM uses a YAML config file to define models and tools. Create a file called `litellm_config.yaml` in your project directory:

```yaml
model_list:
  - model_name: ollama-mistral
    litellm_params:
      model: ollama/mistral
      api_base: http://localhost:11434/v1

general_settings:
  enable_function_calling: true
  enable_caching: true
```

**What this does:**
- Tells LiteLLM to use your local Ollama server
- Enables function/tool calling (so the model can call web search)
- Enables caching (speeds up repeated queries)

---

## Step 3: Define Web Search Tools (Optional but Recommended)

Create a file called `tools.yaml`:

```yaml
tools:
  - name: web_search
    description: Search the web for current information
    parameters:
      query:
        type: string
        description: The search query
      num_results:
        type: integer
        default: 5
        description: Number of results to return
```

**Note:** You still need to actually run a web search service. See "Step 4" for options.

---

## Step 4: Set Up Web Search Backend (Choose One)

### Option A: Use Jina Reader (Simplest)
No setup needed—Jina provides a free public API. Just reference it in LiteLLM.

### Option B: Run Crawl4AI Locally
```bash
pip3 install crawl4ai
crawl4ai --port 8000
```
This runs a web crawler service on `localhost:8000`.

### Option C: Use an API (SerpAPI, Brave Search, etc.)
Sign up for a free tier and get an API key. Then configure it in LiteLLM.

---

## Step 5: Run LiteLLM

```bash
# Basic start (no tools)
litellm --model ollama/mistral --base_url http://localhost:11434

# With config file (recommended)
litellm --config litellm_config.yaml --port 3000
```

**Expected output:**
```
LiteLLM Server listening on http://0.0.0.0:3000
```

Leave this running in a terminal or run it in the background.

---

## Step 6: Test LiteLLM

In a new terminal, test that it's working:

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama-mistral",
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
  }'
```

**Expected response:**
You should get back a JSON response with Ollama's answer.

---

## Step 7: Point Your Clients to LiteLLM

Change where your clients send queries:

### For Discord Bot (N8N or custom)
Change the Ollama endpoint from:
```
http://localhost:11434
```
to:
```
http://localhost:3000
```

### For Ollama Desktop App
In settings, change the API endpoint to:
```
http://localhost:3000
```

### For curl/CLI
Just use `localhost:3000` instead of `localhost:11434`

---

## Step 8: Enable Web Browsing (Advanced)

This is where it gets more complex. You have two paths:

### Path A: Use LiteLLM's Built-In Tool Support
1. Define your web search tool in `tools.yaml`
2. Configure LiteLLM to call an external service
3. Update your model's system prompt to know about the tool
4. The model learns to call it when it sees a research question

**Complexity: Medium-High** — Requires understanding tool definitions and prompt engineering.

### Path B: Custom Wrapper Script
Write a simple Python script that:
1. Receives a query
2. Checks if it's a research question
3. Calls a web search API
4. Sends enriched context to LiteLLM/Ollama
5. Returns the response

**Complexity: Medium** — Requires Python scripting, but straightforward.

---

## Troubleshooting

**"Connection refused" error?**
- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Check LiteLLM port isn't in use: `lsof -i :3000`

**"Model not found" error?**
- Make sure your model name in `litellm_config.yaml` matches what you have installed
- Run `ollama list` to see available models

**Slow responses?**
- LiteLLM is adding a small latency layer, but shouldn't be significant
- Check your model size (larger models = slower)

**Web search not working?**
- Verify the web service (Crawl4AI, Jina, etc.) is running
- Check LiteLLM can reach it (curl the endpoint)

---

## Maintenance (Set-and-Forget?)

**Once running:**
- Just leave the LiteLLM process running (like Ollama)
- Restart if needed: `Ctrl+C` to stop, then run the same command again
- No configuration changes needed unless you want to add new tools

**Failure modes:**
- If LiteLLM crashes, clients can't query Ollama (but Ollama itself is fine)
- If Ollama crashes, LiteLLM can't reach it
- Fix: Restart whichever crashed

---

## Next Steps

1. **Quick start:** Just get LiteLLM running without web tools first
2. **Test:** Verify clients can talk to it
3. **Then add:** Web browsing capability (if the basic setup works)

This lets you assess difficulty in stages rather than all at once.

---

## Difficulty Assessment

| Step | Difficulty | Time |
|------|-----------|------|
| Install LiteLLM | Very Easy | 2 min |
| Config file | Easy | 5 min |
| Run LiteLLM | Easy | 2 min |
| Point clients | Medium | 5-10 min |
| Add web tools | Medium-Hard | 20-30 min |
| **Total (without web)** | **Easy** | **~15 min** |
| **Total (with web)** | **Medium** | **~1 hour** |

The basic proxy works out of the box. Web browsing adds complexity but is optional.
