# Prompt

In Monday.com is there a way to create a unique id each time a new item is added to a board? For example, if each item that is created is a ticket, can I have a column that includes a generated, unique number?

# Model

claude-sonnet-5

# Date

2026-11-01

# Response

Yes. Monday.com has a few ways to do this:

1. **Auto Number column** — built-in column type. Add a column, choose "Auto Number," and every new item gets a sequential unique number automatically (e.g., 1, 2, 3...). You can also set a prefix (like "TICKET-") and starting value.

2. **Item ID (built-in)** — every item in Monday already has a hidden unique Item ID; you can expose it via the "Item ID" column type if you just need uniqueness, not a formatted ticket number.

3. **Formula column** — if you want more control (e.g., combining the auto-number with a board-specific prefix or date), you can use a Formula column referencing the Auto Number column.

4. **Automation-based (most flexible)** — use "When item created, change column value" combined with an integration or a formula pulling in the Auto Number, if you want custom formatting that Auto Number alone can't do.

For a simple ticket ID, the **Auto Number column type** is the standard solution — no automation or scripting required.
