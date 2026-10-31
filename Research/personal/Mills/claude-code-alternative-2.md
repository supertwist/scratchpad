## Open‑source tools that can *understand natural‑language prompts and run real shell commands* (the closest equivalents to Anthropic’s **Claude Code** terminal tool)

| # | Tool / Library | Primary repo / maintainer | License | How it runs commands | Typical LLM back‑ends | Key strengths |
|---|----------------|--------------------------|---------|----------------------|----------------------|----------------|
| **1** | **Open Interpreter** | <https://github.com/Killian/open-interpreter> | Apache 2.0 | Parses the user’s English, converts it to Python + `subprocess` calls, then executes the generated code (including `os.system` / `subprocess.run`). | Any OpenAI‑compatible local LLM (e.g., CodeLlama, StarCoder, LLaMA 2) via **LM Studio**, **Ollama**, or **vLLM**. | The most “out‑of‑the‑box” natural‑language‑to‑terminal experience; interactive REPL; built‑in safety prompts asking for confirmation before each shell call. |
| **2** | **LangChain – ShellTool / BashAgent** | <https://github.com/langchain-ai/langchain> | MIT | `ShellTool` is a LangChain tool that receives a string, runs it with `subprocess.run`, and returns stdout/stderr. `BashAgent` is a ready‑made agent that decides when to call `ShellTool`. | Any LLM that LangChain can talk to (local or remote): OpenAI, Anthropic, Mistral‑7B‑Instruct, Llama 2, CodeLlama, etc. | Full‑featured agent framework; easy to add other tools (search, file‑ops, DB); supports ReAct, Structured‑Chat, and function‑calling style prompting. |
| **3** | **Auto‑GPT (local‑model fork)** | <https://github.com/Significant-Gravitas/AutoGPT> (core) + local‑model forks (e.g., <https://github.com/Significant-Gravitas/AutoGPT-Ollama>) | MIT | Uses a “shell” tool (`subprocess.Popen`) that the agent can invoke to run arbitrary commands. The local‑model forks replace the OpenAI API with an Ollama/vLLM endpoint, so you can run CodeLlama, StarCoder, Mistral‑Coder, etc. locally. | Any OpenAI‑compatible endpoint (Ollama, LM Studio, vLLM). | Fully autonomous “do‑anything” agent; can create files, git‑commit, install packages, and run scripts without human intervention (optional safety “human‑in‑the‑loop”). |
| **4** | **BabyAGI (and variants)** | <https://github.com/yoheinakajima/babyagi> (original) + many forks (e.g., <https://github.com/Significant-Gravitas/babyagi-local>) | MIT | Implements a minimal task loop; the “execute_task” step can be a Python function that runs `subprocess.run`. Local forks swap the OpenAI client for Ollama/LM Studio, letting you run any self‑hosted LLM. | Any local LLM via an OpenAI‑compatible server. | Very lightweight; ideal for experimentation and for adding your own “shell” tool. |
| **5** | **SuperAGI** | <https://github.com/TransformerOptimus/SuperAGI> | Apache 2.0 | Provides a “Shell” tool that runs `subprocess.run`. The platform’s “Agent” can decide to call it based on a ReAct‑style prompt. | Any OpenAI‑compatible LLM (including local endpoints). | UI‑driven workflow; supports multi‑step pipelines, scheduled jobs, and easy plug‑in of new tools. |
| **6** | **TaskWeaver** | <https://github.com/microsoft/TaskWeaver> | MIT | A “ShellTool” that executes bash commands and streams the output back to the LLM. Designed for multi‑step reasoning with tool use. | Any LLM served via OpenAI‑compatible API (including local models). | Research‑grade ReAct implementation; strong support for tool‑use planning, state tracking, and error handling. |
| **7** | **OpenAI‑function‑calling‑compatible libraries for local LLMs** (e.g., **Functionary**, **Guidance**, **vLLM function calling**) | Functionary: <https://github.com/Functionary/Functionary>  <br> Guidance: <https://github.com/guidance-ai/guidance> | Apache 2.0 (Functionary) / MIT (Guidance) | They let you describe a “run_shell” function (JSON schema). When the LLM “calls” it, your Python wrapper runs the command via `subprocess`. | Any model that supports function calling (Llama 2‑Chat, Mistral‑Instruct, CodeLlama‑Chat). | Gives you a lightweight, no‑framework‑overhead way to add a terminal tool to any locally‑hosted LLM. |
| **8** | **JARVIS (CLI AI assistant)** | <https://github.com/nikitavoloboev/jarvis> | MIT | Reads a natural‑language prompt, sends it to the LLM, and executes the returned command after a safety‑prompt. | Works with any OpenAI‑compatible endpoint (including Ollama). | Minimalist CLI; good for quick “ask‑and‑run” workflows. |
| **9** | **BashGPT** | <https://github.com/Significant-Gravitas/bashgpt> | MIT | Takes a user query, asks the LLM to produce a safe bash script, then runs it (or asks for confirmation). | Any LLM via OpenAI‑compatible API (local or remote). | Very focused on bash; includes a “dry‑run” mode that shows the script before execution. |
| **10** | **Shell‑GPT** | <https://github.com/TheR1D/shell-gpt> | MIT | CLI wrapper around an LLM that returns a command and runs it after you approve. | Works with any OpenAI‑compatible endpoint (including local). | Simple, easy‑to‑install (`pip install shell-gpt`). |
| **11** | **AIDE – AI‑Powered IDE Assistant** | <https://github.com/LAION-AI/aide> (VS Code extension) | MIT | Provides a “run in terminal” command that sends the generated snippet to the integrated terminal. | Any local LLM served via an OpenAI‑compatible endpoint (e.g., CodeLlama through LM Studio). | Tight VS Code integration; can edit, run, and debug code directly from the editor. |
| **12** | **GPT‑Engineer** | <https://github.com/AntonOsika/gpt-engineer> | MIT | Generates full project code, writes files, then runs a `run` step (e.g., `npm install && npm start`) that you can customize. | Any OpenAI‑compatible LLM (including local). | Great for bootstrapping whole codebases; the “run” phase can be pointed at any shell command you define. |
| **13** | **Semantic Kernel (Microsoft)** | <https://github.com/microsoft/semantic-kernel> | MIT | Offers a `Shell` skill that runs commands; you can plug in any LLM (including local). | Any LLM that conforms to the SK abstracted AI client (OpenAI, Azure, Ollama, etc.). | Enterprise‑grade, pluggable architecture; supports planning, memory, and orchestration. |
| **14** | **LM Studio + “Terminal” plugin** | <https://github.com/lmstudio-ai/lm-studio> (core) + community plugin | GPL‑3.0 (LM Studio) / MIT (plugin) | LM Studio provides a UI for a local LLM; the “Terminal” plugin lets the model request execution of a command, which the host UI runs after user confirmation. | Any model you load into LM Studio (e.g., CodeLlama, StarCoder, Mistral‑Coder). | All‑local UI, no external API, and the plugin handles safety dialogs automatically. |

---

### 1️⃣ Quick‑look at the most “plug‑and‑play” options

| Tool | How to start (one‑liner) | What you need locally |
|------|--------------------------|-----------------------|
| **Open Interpreter** | `pip install open-interpreter && interpreter` | Python 3.10+, any LLM server (Ollama, LM Studio, vLLM). |
| **Shell‑GPT** | `pip install shell-gpt && shell-gpt "list all python files"` | Works with any OpenAI‑compatible endpoint; set `OPENAI_API_BASE` to your local server. |
| **LangChain BashAgent** | ```python\nfrom langchain.agents import initialize_agent, Tool\nfrom langchain.llms import Ollama\n\ndef run_shell(cmd):\n    import subprocess, shlex\n    result = subprocess.run(shlex.split(cmd), capture_output=True, text=True)\n    return result.stdout or result.stderr\n\nshell_tool = Tool(name="shell", func=run_shell, description="Runs a bash command and returns its output.")\nllm = Ollama(model="code-llama:34b")\nagent = initialize_agent([shell_tool], llm, agent="zero-shot-react-description", verbose=True)\nagent.run(\"list the largest files in the current directory\")\n``` | Python, `langchain`, an LLM endpoint (Ollama, LM Studio, etc.). |
| **Auto‑GPT (local‑model fork)** | Clone the repo, set `OPENAI_API_BASE` to `http://localhost:11434/v1` (Ollama), then `python -m autogpt` | Python, Ollama (or LM Studio) serving a model with chat capabilities. |
| **LM Studio + Terminal plugin** | Open LM Studio → Load a model → Install “Terminal” plugin from the plugin marketplace. | LM Studio (desktop app) + any GGUF model (e.g., CodeLlama‑7B‑Q4). |

---

## 2️⃣ How the pieces fit together

| Piece | What it does | Typical open‑source options |
|-------|--------------|----------------------------|
| **LLM inference engine** (provides the “brain”) | Generates the textual plan / command. | **Ollama**, **LM Studio**, **vLLM**, **llama.cpp**, **text‑generation‑webui** (any of these can expose an OpenAI‑compatible REST endpoint). |
| **Tool‑calling / agent framework** | Turns a natural‑language request into a concrete “call a function” (e.g., `run_shell`). Handles the reasoning loop, error recovery, and optionally asks for user confirmation. | **LangChain**, **Semantic Kernel**, **Auto‑GPT**, **BabyAGI**, **SuperAGI**, **TaskWeaver**, **Functionary** (function‑calling library). |
| **Shell‑execution wrapper** | Safely runs `subprocess.run` (or equivalent) and captures stdout/stderr. | Usually a tiny Python function you write yourself, or the built‑in `ShellTool`/`ShellSkill` that comes with the framework. |
| **Safety/confirmation layer** | Shows the generated command to the user, asks “OK to run?”, optionally runs inside a sandbox (Docker, `nsjail`, or `firejail`). | Many projects have this built‑in (Open Interpreter, Shell‑GPT, Auto‑GPT “human‑in‑the‑loop”). You can also add your own wrapper. |

---

## 3️⃣ Getting a minimal “Claude‑Code‑like” REPL in < 5 minutes

Below is a **self‑contained Python script** that uses **LangChain** + **Ollama** + a simple shell tool. It works with any locally‑hosted model (e.g., `code-llama:34b`, `starcoder:15b`, `mistral-coder:7b`).  

```python
# file: shell_agent.py
import os, shlex, subprocess
from langchain.agents import initialize_agent, Tool
from langchain.llms import Ollama
from langchain.prompts import ChatPromptTemplate

# ---------- 1. Define the shell tool ----------
def run_shell(command: str) -> str:
    """Execute a bash command and return its output."""
    # Safety: you could whitelist/blacklist commands here.
    try:
        result = subprocess.run(
            shlex.split(command),
            capture_output=True,
            text=True,
            timeout=30,
        )
        out = result.stdout.strip()
        err = result.stderr.strip()
        return out if out else err
    except Exception as e:
        return f"Error: {e}"

shell_tool = Tool(
    name="shell",
    func=run_shell,
    description="Runs a bash command and returns the terminal output. Use ONLY for tasks that require OS interaction.",
)

# ---------- 2. Connect to a local LLM ----------
# Make sure Ollama is running: `ollama serve`
llm = Ollama(model="code-llama:34b", temperature=0.2)  # swap model name as you wish

# ---------- 3. Build a ReAct‑style agent ----------
agent = initialize_agent(
    tools=[shell_tool],
    llm=llm,
    agent="zero-shot-react-description",  # ReAct reasoning loop
    verbose=True,
)

# ---------- 4. REPL ----------
print("\n🦜  Open‑source Claude‑Code‑style terminal assistant")
print("Type ‘exit’ or Ctrl‑C to quit.\n")
while True:
    try:
        user_query = input(">>> ")
        if user_query.lower() in {"exit", "quit"}:
            break
        # The agent decides whether to call the shell tool or just answer.
        answer = agent.run(user_query)
        print("\n💡", answer, "\n")
    except KeyboardInterrupt:
        break
```

**How to run**

```bash
# 1️⃣ Install dependencies
pip install langchain[all] ollama  # langchain[all] brings in the OpenAI‑compatible client

# 2️⃣ Start Ollama (or any other server exposing the /v1/chat/completions API)
ollama serve &   # runs in background; you can also use `ollama run code-llama:34b` for a quick test

# 3️⃣ Launch the REPL
python shell_agent.py
```

**What you get**

- Type a natural language request: `list the 5 largest files in the current folder`.
- The agent decides it needs to run a shell command, calls `run_shell`, and prints the result.
- If the request is purely informational (`explain the quicksort algorithm`), the LLM just answers without touching the OS.

**Safety tip** – before using this in production, replace `run_shell` with a wrapper that:
- Shows the command and asks for explicit confirmation (`input("Run? [y/N] ")`).
- Executes inside a sandbox (`docker run --rm -v "$PWD":/work -w /work python:3.11 bash -c "$cmd"`).

---

## 4️⃣ When to pick which tool?

| Situation | Recommended tool(s) | Reason |
|-----------|---------------------|--------|
| **Just want a quick “ask‑and‑run” REPL** | **Open Interpreter** or **Shell‑GPT** | Zero‑code setup, built‑in safety prompts. |
| **Building a custom agent that also uses web search, file I/O, DB calls, etc.** | **LangChain** (ShellTool + other tools) or **Semantic Kernel** | Modular tool‑registry; you can compose many capabilities. |
| **Fully autonomous “do‑anything” AI that can self‑iterate (install packages, commit, push, run tests)** | **Auto‑GPT** (local‑model fork) or **SuperAGI** | Task‑loop, memory, and built‑in retry logic. |
| **Research / prototype of ReAct reasoning with tool use** | **TaskWeaver**, **BabyAGI**, **Functionary** | Light‑weight, easy to instrument for experiments. |
| **You already use VS Code and want terminal integration** | **AIDE** (VS Code extension) or **Tabby + custom terminal plugin** | Runs inside the editor; you can edit, run, and debug in one place. |
| **Enterprise / multi‑user platform with policy enforcement** | **Semantic Kernel** or **SuperAGI** (both support pluggable policy modules) | Designed for production deployment, logging, and role‑based access. |
| **Minimal code footprint, just need a function‑call wrapper** | **Functionary** or **Guidance** + a tiny Python `run_shell` function | No heavy agent framework; you embed the tool call directly in your inference loop. |

---

## 5️⃣ Safety & sandboxing best practices (essential when you let an LLM run arbitrary commands)

| Concern | Mitigation technique | Tools that already include it |
|---------|----------------------|------------------------------|
| **Accidental destructive commands (`rm -rf /`, `dd if=… of=…`)** | - Prompt‑level guardrails (LLM instructed not to generate dangerous commands). <br> - Whitelist/blacklist regex patterns. <br> - Run inside a **container** (`docker run --rm -v "$PWD":/work -w /work ...`). | Open Interpreter (asks for confirmation), Shell‑GPT (dry‑run mode), LangChain (you can inject a wrapper). |
| **Network‑exfiltration (curl, wget to external IPs)** | - Disable network access inside the sandbox (e.g., Docker `--network none`). | SuperAGI’s sandbox configuration. |
| **Resource exhaustion (fork bombs, infinite loops)** | - Set `subprocess.run(..., timeout=…)`. <br> - Use OS‑level limits (`ulimit -t 10` for CPU, `ulimit -v 200000` for memory). | Open Interpreter uses a 30‑second timeout by default. |
| **Privilege escalation** | - Run the agent as an unprivileged user (no `sudo`). <br> - Use `firejail` or `nsjail` to drop capabilities. | Can be added around any tool wrapper. |
| **Data leakage (printing secret env vars)** | - Scrub `os.environ` before exposing to the LLM. <br> - Mask output that matches known secret patterns (regex for keys, tokens). | Not built‑in; you need a wrapper. |
| **Auditability** | - Log every command **before** execution, plus stdout/stderr, timestamps, and the original user query. | LangChain’s `verbose=True` logs tool calls; SuperAGI writes to a DB. |

---

## 6️⃣ Putting it all together – a “starter kit” you can clone and run

```bash
git clone https://github.com/karpathy/open-interpreter.git   # or any of the repos above
cd open-interpreter
# Choose your LLM server (e.g., Ollama)
ollama pull code-llama:34b
# Install the interpreter (Python ≥3.10)
pip install -e .
# Run with safety prompts (default)
interpreter
```

If you prefer the **LangChain** route:

```bash
git clone https://github.com/langchain-ai/langchain.git
cd langchain
pip install -e .[all]
# Create a file `run_agent.py` (copy the script from section 3)
python run_agent.py
```

Both approaches give you:

- **Natural‑language input** → **LLM reasoning** → **shell execution** → **output displayed**.
- Full **local execution** (no API keys, no data leaves your machine).
- The ability to **swap models** (`code-llama`, `starcoder`, `mistral-coder`, `deepseek-coder`) by simply pointing the client at a different endpoint.

---

## 7️⃣ Future‑proofing & community

| Project | Recent activity (2024‑2025) | Community hub |
|---------|----------------------------|---------------|
| **Open Interpreter** | v0.7 released (improved safety dialogs, Docker sandbox mode). | Discord + GitHub Discussions |
| **LangChain** | v0.2 – new “Tool‑use” UI, built‑in “BashAgent”. | LangChain Community Slack |
| **Auto‑GPT** | Several “local‑model” forks (Ollama, LM Studio) kept up‑to‑date. | Reddit r/AutoGPT |
| **TaskWeaver** | Integrated with Azure OpenAI, but also supports generic endpoints. | Microsoft Teams channel (open‑source) |
| **Functionary** | Added “function calling” for Llama 2‑Chat, Mistral‑Instruct. | GitHub Issues |
| **SuperAGI** | v0.3 adds “policy engine” for command whitelisting. | Discord |
| **LM Studio** | v0.5 introduced “plugin” system (Terminal plugin). | Discord + GitHub Discussions |

Keeping an eye on these repos will let you adopt newer safety mechanisms (e.g., automatic sandboxing, policy‑as‑code) without rewriting your own wrappers.

---

## TL;DR – What to try first

| Goal | Quickest path |
|------|---------------|
| **Just a terminal chat assistant** | `pip install open-interpreter && interpreter` |
| **A REPL you can extend with file I/O, web search, DB, etc.** | LangChain + ShellTool (see 5‑minute script) |
| **Fully autonomous “do‑anything” agent** | Clone a local‑model Auto‑GPT fork, point it at Ollama, enable `human-in-the-loop` for each shell call |
| **Integrate with VS Code** | Install the **AIDE** extension, load a local model via LM Studio, enable the “run in terminal” feature |
| **Zero‑code function‑call sandbox** | Use **Functionary** with a tiny `run_shell` wrapper – < 30 lines of Python |

All of these are open‑source, run on your own hardware (or any private cloud), and give you the same core capability that Claude Code offers: **understand a natural‑language request, generate the appropriate shell command, and execute it safely**. Happy hacking!