# Rhino 8: Using Block Instances to Reduce File Size & Compute Load

When working with multiple copies of a large, complex model, Rhino lets you
create **one real copy** (the "block definition") and then place as many
**instances** of it as you want. Each instance is just a pointer to the
original geometry plus a position/rotation/scale — not a full duplicate — so
file size and memory use stay low no matter how many copies you place.

## Step-by-step: basic blocks (same file)

1. **Build or import one copy** of your complex model into the Rhino file.
2. **Select all the objects** that make up that one copy.
3. Run the **`Block`** command.
   - Rhino asks you to pick a **base point** — this is the reference point
     Rhino uses when you move, rotate, or scale an instance later. Pick
     something meaningful, like the bottom-center of the model.
   - Type a **name** for the block definition (e.g. `Chair_A`).
   - Rhino replaces your selected objects with a single block **instance**
     and stores the actual geometry once, internally, as the **definition**.
4. To **place more copies**, run **`Insert`**, choose your block by name, and
   click to place it (you can set scale/rotation during placement too). You
   can also just `Copy`/array/paste an existing instance — copies of an
   instance are still lightweight instances, not new geometry.
5. To **edit the model everywhere at once**: double-click an instance (or use
   `BlockEdit`), make your changes, and every instance in the file updates
   automatically.
6. To **see and manage all block definitions**, open the **Block Definitions
   panel** by running `BlockManager`. From there you can rename, delete,
   purge unused blocks, or see how many instances of each block exist.

## Step-by-step: linked blocks (separate files — best for very large/complex models)

Use this when the "complex model" is big enough that you don't want it fully
embedded and duplicated across multiple project files at all.

1. Save your complex model as its **own standalone `.3dm` file** (e.g.
   `ComplexModel_A.3dm`).
2. In the file where you want to use it, run **`Insert`**.
3. Browse to and select the external `.3dm` file.
4. Choose the **"Linked"** insert option (as opposed to "Embedded"). This
   tells Rhino to keep referencing the external file rather than copying its
   geometry into the current file.
5. Pick an insertion point, scale, and rotation — Rhino places a linked block
   instance.
6. **Place more instances** the same way (run `Insert` again, or copy the
   existing linked instance) — each one still only references the single
   external file.
7. **To update everywhere:** edit and save the external source file. The next
   time the referencing file is opened (or refreshed), Rhino re-reads the
   external file and updates all linked instances automatically.
8. If you need **variations** of the same base linked block (e.g. three
   different "flavors" of the same model, each with different internal
   layer overrides), use **`CopyLinkedBlockDefinition`** to duplicate the
   linked definition under a new name rather than re-linking from scratch.

## Useful per-instance tweaks (without breaking the shared geometry)

Even though all instances share one geometry definition, you can still vary
**each instance's** layer, color, or other display attributes individually —
useful for telling copies apart visually without duplicating geometry.

## Notes & tips

- Nesting works: a block can contain other blocks, which compounds the
  file-size savings for assemblies made of repeated sub-parts.
- Most render engines (V-Ray, Enscape, Cycles, etc.) recognize Rhino blocks
  natively and instance them on the GPU too — so this also helps render
  performance, not just file size.
- Run `BlockManager` periodically to **purge unused block definitions** left
  over from deleted instances — they still take up file size until purged.

## Documentation links

- [Block command](https://docs.mcneel.com/rhino/8/help/en-us/commands/block.htm) — defining a block from selected objects
- [Insert command](https://docs.mcneel.com/rhino/8/help/en-us/commands/insert.htm) — placing block instances, including linked blocks from external files
- [Block Instance properties](https://docs.mcneel.com/rhino/8/help/en-us/properties/blockinstance.htm) — per-instance properties and overrides
- [New in Rhino 8 — Block Definitions panel](https://docs.mcneel.com/rhino/8/help/en-us/commandlist/newinrhino8.htm) — modeless `BlockManager` panel with search/filter/drag-drop
- [Work with blocks, groups, and worksessions](https://docs.mcneel.com/rhino/8/help/en-us/seealso/sak_blocksgroups.htm) — overview of related concepts
- [Using Blocks (McNeel Wiki)](https://wiki.mcneel.com/rhino/usingblocks) — practical workflow notes, including redefining blocks
