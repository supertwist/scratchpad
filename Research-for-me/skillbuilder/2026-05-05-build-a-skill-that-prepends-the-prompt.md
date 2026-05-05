---
prompt: |
  build a skill that prepends the prompt(verbatim), the current model, and the current date to the output of a prompt, and saves the complete output to a .md file in the current directory.
model: claude-opus-4-7
date: 2026-05-05
---

Saved as `prompt-archive-skill.md` in scratchpad.

**To install it as a real skill**, move the file into place:

```bash
mkdir -p ~/.claude/skills/prompt-archive
mv /Users/james/GIT/scratchpad/prompt-archive-skill.md ~/.claude/skills/prompt-archive/SKILL.md
```

**Behavior summary:**
- Triggers on phrases like "save this to a file" or `/prompt-archive`
- Captures your prompt verbatim (YAML block-scalar preserves whitespace/multiline)
- Reads model ID from env context (`claude-opus-4-7` etc.) and date from `currentDate`
- Default filename: `{YYYY-MM-DD}-{slug}.md` in cwd; honors user-specified name/dir
- Refuses to overwrite — appends `-2`, `-3` if the path collides
- Replies in chat with just the absolute path; full content lives only in the file

---

**Built artifact** (`~/.claude/skills/prompt-archive/SKILL.md`):

````markdown
---
name: prompt-archive
description: Use when the user asks to save, archive, log, or record a response to a markdown file — or invokes /prompt-archive. Saves the response to a .md file in the current working directory, prepended with the verbatim user prompt, the current model ID, and the current date.
---

# Prompt Archive

## When to use this skill

Trigger this skill when the user asks Claude to capture a response to disk for later reference. Typical phrases:

- "save this to a file"
- "archive this response"
- "log this prompt and answer as markdown"
- "/prompt-archive ..."

**Out of scope:** This skill does not save *previous* turns from the conversation, summarize history, or write to anywhere outside the current working directory. It captures one prompt-response pair: the prompt that invoked the skill, and the response generated for it.

## Role

You are a careful archivist. Reproduce the user's prompt **verbatim** — same wording, same punctuation, same line breaks, no cleanup, no paraphrasing, no "helpful" formatting. The point of an archive is fidelity.

## Inputs

**Required:**
- The user's prompt that invoked this skill — captured verbatim from the most recent user message.

**Optional:**
- `filename` — if the user specifies one, honor it (append `.md` if missing). Default: derive from the prompt (see Workflow step 4).
- `directory` — if the user specifies a path, save there. Default: the current working directory.

**If the user's prompt is empty or only contains the trigger phrase** (e.g., they typed only `/prompt-archive` with no further question): ask what they'd like archived before generating anything.

## Workflow

1. **Capture the prompt verbatim.** Take the exact text of the user message that triggered this skill. Preserve whitespace, line breaks, and punctuation. If the user prefixed it with a trigger phrase like "save this:" or "/prompt-archive", strip only that trigger and keep the rest exact.

2. **Identify the model.** Read the model identifier from the environment context provided at session start (e.g., `claude-opus-4-7`, `claude-sonnet-4-6`). Use the exact model ID string, not a marketing name.

3. **Identify the date.** Read today's date from the environment context (`currentDate`). Format as `YYYY-MM-DD`.

4. **Determine the filename.**
   - **If** the user specified a filename, use it (append `.md` if missing).
   - **Otherwise**, derive a slug from the first 6–8 meaningful words of the prompt: lowercase, replace non-alphanumerics with hyphens, collapse repeats, trim to ~50 chars. Filename: `{date}-{slug}.md`. Example: prompt `"explain how rsync handles symlinks"` on 2026-05-05 → `2026-05-05-explain-how-rsync-handles-symlinks.md`.

5. **Determine the absolute save path.** Resolve the target directory to an absolute path (run `pwd` if needed). Join with the filename. **Quality gate:** if a file with that name already exists, append `-2`, `-3`, etc., before the `.md` extension until the path is free. Do not overwrite.

6. **Generate the response** to the user's prompt as you normally would.

7. **Assemble the file contents** using the Output format below.

8. **Write the file** with a single Write tool call to the absolute path.

9. **Reply to the user** with a one-line confirmation: the absolute path of the saved file. Do not re-paste the response body — they just saw it generated, and it is now on disk.

## Output format

The saved `.md` file must have exactly this structure:

```
---
prompt: |
  {{verbatim prompt, indented two spaces under the pipe}}
model: {{model-id}}
date: {{YYYY-MM-DD}}
---

{{response body — the answer you generated for the prompt, exactly as you would have shown it in chat, with no header repetition and no trailing "saved to..." line}}
```

**Constraints:**
- The verbatim prompt goes inside a YAML block-scalar (`prompt: |`) so multi-line prompts and special characters survive intact.
- The `---` fence closes before a blank line, then the response body begins.
- The response body must NOT include a re-statement of the prompt, the model, or the date — those live in the frontmatter only.
- The response body must NOT include a trailing "Saved to ..." or similar meta-commentary — that goes only in the chat reply, not the file.

## Quality criteria

Before considering the skill complete, all of the following must be true:

- [ ] The frontmatter contains all three keys: `prompt`, `model`, `date`.
- [ ] The `prompt` value is byte-for-byte identical to the user's input (after stripping only the trigger prefix, if any).
- [ ] The `model` value is a real model ID string (e.g., `claude-opus-4-7`), not a friendly name like "Opus."
- [ ] The `date` is in `YYYY-MM-DD` form and matches today.
- [ ] The file path is absolute and lives in the user's intended directory (default: cwd).
- [ ] The file did not overwrite an existing file.
- [ ] The chat reply is one line and contains the absolute path.

**Failure example:** A file named `response.md` written to `~/` (not cwd) containing the response with the prompt paraphrased into a heading like "## Question: How does rsync handle symlinks" and no frontmatter. This fails because: wrong directory, paraphrased not verbatim, no model, no date, no YAML frontmatter.

## Self-validation

After writing the file, before sending the chat reply, re-read the file you just wrote. Verify the frontmatter parses (three keys present, `---` fences correct), the verbatim prompt matches the user's input exactly, and the response body has no leaked metadata. If any check fails, fix the file and re-write before replying.
````
