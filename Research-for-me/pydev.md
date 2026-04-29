# Adding a local Ollama provider to pi.dev

**Prompt:** Create step-by-step instructions for adding a local instance of ollama as a "provider" for py.dev

**Model:** Claude Opus 4.7 (`claude-opus-4-7`)

**Date:** 2026-04-29

---

Note: I'm assuming you meant **pi.dev** (the coding-agent CLI in your linkroll), not "py.dev". Steps below are for pi.

## Step-by-step: add local Ollama as a provider in pi

**1. Make sure Ollama is running locally**

```bash
ollama serve            # if not already running
ollama pull qwen2.5-coder:7b   # or any model you want
ollama list             # confirm what's installed
```

By default Ollama listens on `http://localhost:11434`. The OpenAI-compatible endpoint pi needs is `http://localhost:11434/v1`.

**2. Create or edit `~/.pi/agent/models.json`**

```bash
mkdir -p ~/.pi/agent
$EDITOR ~/.pi/agent/models.json
```

**3. Add an `ollama` provider block**

Minimal version — fill `models` with whatever `ollama list` shows:

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        { "id": "qwen2.5-coder:7b" },
        { "id": "llama3.1:8b" }
      ]
    }
  }
}
```

Notes on the fields:
- `baseUrl` — must end in `/v1` (Ollama's OpenAI-compat shim).
- `api` — `openai-completions` is what pi expects for Ollama.
- `apiKey` — required by the schema; Ollama ignores the value, so any string works.
- `compat.*` — leave both `false` for Ollama. Ollama doesn't implement the `developer` role or `reasoning_effort`; without these flags pi will send requests Ollama rejects.
- Each model `id` must match an Ollama tag exactly (`ollama list` is the source of truth).

**4. Optional: richer per-model metadata**

Only useful if you want pretty names in the picker, accurate context-window display, or want pi to stop nagging about cost. Everything except `id` is optional.

```json
{
  "id": "qwen2.5-coder:7b",
  "name": "Qwen2.5 Coder 7B (Local)",
  "reasoning": false,
  "input": ["text"],
  "contextWindow": 128000,
  "maxTokens": 32000,
  "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
}
```

**5. Switch to the model inside pi**

In a running pi session run `/model` — the file reloads on every invocation, so no restart. Pick the Ollama entry and you're on local.

**6. Sanity check**

If the model doesn't appear or requests fail:
- `curl http://localhost:11434/v1/models` — confirms the OpenAI shim is up.
- Tail Ollama's logs while sending a prompt; mismatched `id` is the most common cause of "model not found".
- If you see 400s about `developer` role or `reasoning_effort`, double-check both `compat` flags are `false`.

Sources:
- [pi.dev models docs](https://pi.dev/docs/latest/models)
- [pi-mono models.md (GitHub)](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md)
- [Ollama × Pi integration page](https://docs.ollama.com/integrations/pi)
