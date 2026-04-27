# How Claude Skills Are Created

A skill is a folder containing a `SKILL.md` file with YAML frontmatter and instructions. Minimal structure:

```
my-skill/
  SKILL.md
```

`SKILL.md` frontmatter requires:
- `name` — the skill identifier
- `description` — when to trigger it (this is what Claude reads to decide relevance)

The body is free-form Markdown: instructions, workflows, examples. Skills can also bundle supporting files (scripts, references, templates) alongside `SKILL.md`, which the skill body can point Claude to.

**Locations:**
- User-level: `~/.claude/skills/<name>/SKILL.md`
- Project-level: `.claude/skills/<name>/SKILL.md`
- Plugin-bundled: shipped inside a plugin you install

# How a User Activates a Skill

Two activation paths:

1. **Explicit** — type `/<skill-name>` in the prompt. Claude invokes it directly via the Skill tool.
2. **Automatic** — Claude sees the skill's `name` + `description` in its available-skills list each turn. When the user's request matches the description, Claude calls the Skill tool itself without the user typing the slash command.

That's why the `description` field matters most: it's the trigger criteria Claude pattern-matches against natural-language requests.
