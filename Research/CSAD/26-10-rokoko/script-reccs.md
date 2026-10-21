# Rokoko Studio Live for Blender — retargeting crash diagnosis

## Error

```
File ".../rokoko-studio-live-blender-master/operators/retargeting.py", line 34, in execute
    retargeting_dict = detector.detect_retarget_bones()
File ".../rokoko-studio-live-blender-master/core/detection_manager.py", line 298, in detect_retarget_bones
    for fc in armature_source.animation_data.action.fcurves:
AttributeError: 'Action' object has no attribute 'fcurves'
```

## Root cause

Addon: Rokoko Studio Live for Blender, v1.4.3, declared minimum Blender `2.80` (`__init__.py`).

Blender 4.4+ introduced the "layered Actions" / slotted-action redesign: an `Action`
data-block no longer exposes a flat `.fcurves` list directly. F-curves now live under
`action.layers[...].strips[...].channelbags[...].fcurves`, addressed via an action slot.
Blender 5.2 (the version in use) uses this new model exclusively, so `action.fcurves`
does not exist — hence the `AttributeError` at `detection_manager.py:298`.

This is a Blender API/version compatibility issue in the addon, not a problem with the
rig or captured mocap data.

## Full scope of affected call sites (grep for `.fcurves`)

**Read/iterate `.fcurves`** (would hit the same `AttributeError`):
- `core/detection_manager.py:298` — the call site that already crashed
- `operators/retargeting.py:286, 288, 367, 470, 483, 510` — iterating and
  `.remove()`-ing fcurves during retargeting cleanup/merge

**Write `.fcurves.new(...)`** (creating new curves — also broken, since `Action` has
no `.fcurves` to create on):
- `core/recorder.py:135, 182, 219` — used while recording live Rokoko data into actions
- `core/fbx_patcher.py:101` — used during FBX import patching
- `operators/retargeting.py:493` — used when baking the final retargeted action

**Lookup `.fcurves.find(...)`**:
- `core/fbx_patcher.py:201`
- `operators/retargeting.py:499`

13 call sites across 4 files total. This is not a single-line fix — the whole addon
assumes the pre-4.4 flat `Action.fcurves` model for reading, creating, finding, and
removing curves across recording, FBX import, and retargeting.

## Recommendations (in order of effort/risk)

1. **Check upstream first.** Search the Rokoko GitHub repo/issues/releases for a
   Blender 4.4+/5.x compatible release or community fork before investing in a local
   patch. Cheapest option if it exists.

2. **Local compatibility shim.** Add a small new module, e.g.
   `core/fcurve_compat.py`, with three helpers that branch on
   `hasattr(action, "fcurves")` to support both the old and new Blender animation
   models:
   - `get_fcurves(action)` — returns a flat list of fcurves regardless of API version
   - `new_fcurve(action, data_path, index, group=None)` — creates a new fcurve;
     on the new API this must first ensure a layer/strip/channelbag/slot chain
     exists before creating into it (the tricky part)
   - `find_fcurve(action, data_path, index)` — looks up an existing fcurve by
     data_path/index across either API

   Then swap all 13 call sites listed above to use these helpers instead of calling
   `.fcurves` directly. Mechanical change once the shim is correct, but `new_fcurve`
   needs care since the new action model requires an existing slot/channelbag
   before you can create curves into it.

3. **Downgrade Blender** to a pre-4.4 version for this specific workflow if a local
   patch isn't viable in the short term. Not a long-term fix, but unblocks work
   immediately.

## Status

No files have been modified. Read-only investigation only; write access to the addon
directory has not yet been granted.
