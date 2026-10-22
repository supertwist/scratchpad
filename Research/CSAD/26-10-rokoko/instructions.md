# Installing the F-curve compatibility shim

## Where it goes

Copy `fcurve_compat.py` from this repo into the addon's `core/` directory:

```
/Users/james/Library/Application Support/Blender/5.2/scripts/addons/rokoko-studio-live-blender-master/core/fcurve_compat.py
```

That directory already contains `detection_manager.py`, `recorder.py`, `fbx_patcher.py`,
etc. - `fcurve_compat.py` should sit alongside them so it can be imported with:

```python
from . import fcurve_compat
```

(from files directly in `core/`) or:

```python
from ..core import fcurve_compat
```

(from files in `operators/`, e.g. `retargeting.py`).

## Why

See `script-reccs.md` in this repo for the full diagnosis. Short version: Blender 4.4+
replaced the flat `Action.fcurves` collection with a layered
`layers -> strips -> channelbags -> fcurves` model, so any addon code written for
Blender <4.4 that touches `action.fcurves` directly raises
`AttributeError: 'Action' object has no attribute 'fcurves'` on Blender 5.2.
`fcurve_compat.py` provides drop-in helper functions that work on both API
generations.

## Call sites that need updating

Once the file is in place, these 13 call sites (found via `grep -rn "\.fcurves"`)
need to be switched from direct `.fcurves` access to the shim. I have **not** made
these edits yet - no write access has been granted to the addon directory. This
list is here so the edits can be applied in one pass once you're ready.

### `core/detection_manager.py`
- **Line 298** (read/iterate):
  ```python
  # before
  for fc in armature_source.animation_data.action.fcurves:
  # after
  for fc in fcurve_compat.get_action_fcurves(armature_source.animation_data):
  ```

### `operators/retargeting.py`
- **Line 286** (read/iterate) and **288** (remove) - `clean_animation()`:
  ```python
  # before
  for fcurve in armature_source.animation_data.action.fcurves:
      if fcurve.data_path in deletable_fcurves:
          armature_source.animation_data.action.fcurves.remove(fcurve)
  # after
  slot = fcurve_compat.get_action_slot(armature_source.animation_data)
  for fcurve in fcurve_compat.get_action_fcurves(armature_source.animation_data):
      if fcurve.data_path in deletable_fcurves:
          fcurve_compat.remove_fcurve(armature_source.animation_data.action, fcurve, slot=slot)
  ```
- **Line 367** (read/iterate) - `read_anim_start_end()`:
  ```python
  # before
  for fcurve in armature.animation_data.action.fcurves:
  # after
  for fcurve in fcurve_compat.get_action_fcurves(armature.animation_data):
  ```
- **Line 470** (read/iterate) - key counting loop over `actions_all`:
  ```python
  # before
  for fcurve in action.fcurves:
  # after
  for fcurve in fcurve_compat.get_fcurves(action):
  ```
  (no slot needed here - these are freshly baked, single-purpose actions)
- **Line 483** (read/iterate), **493** (create), **499** (find) - the baked-action
  merge loop:
  ```python
  # before
  for fcurve in actions_all[0].fcurves:
      ...
      curve_final = action_final.fcurves.new(data_path=fcurve.data_path, index=fcurve.array_index, action_group=fcurve.group.name)
      ...
      for action in actions_all:
          fcruve_to_add = action.fcurves.find(data_path=fcurve.data_path, index=fcurve.array_index)
  # after
  for fcurve in fcurve_compat.get_fcurves(actions_all[0]):
      ...
      curve_final = fcurve_compat.new_fcurve(action_final, fcurve.data_path, index=fcurve.array_index, action_group=fcurve.group.name)
      ...
      for action in actions_all:
          fcruve_to_add = fcurve_compat.find_fcurve(action, fcurve.data_path, index=fcurve.array_index)
  ```
- **Line 510** (read/iterate) - cleanup pass over `action_final`:
  ```python
  # before
  for fcurve in action_final.fcurves:
  # after
  for fcurve in fcurve_compat.get_fcurves(action_final):
  ```

### `core/recorder.py`
- **Lines 135, 182, 219** (create) - all three follow the same pattern:
  ```python
  # before
  curve = action.fcurves.new(data_path=data_path, index=axis_i)
  # after
  curve = fcurve_compat.new_fcurve(action, data_path, index=axis_i)
  ```
  These all create a brand-new `action` a few lines earlier in the same function
  and assign it via `obj.animation_data_create().action = action`, so there's no
  pre-existing slot to look up - `new_fcurve` will create one automatically.

### `core/fbx_patcher.py`
- **Line 101** (create):
  ```python
  # before
  blen_curves = [action.fcurves.new(prop, index=channel, action_group=grpname)
                 for prop, nbr_channels, grpname in props for channel in range(nbr_channels)]
  # after
  blen_curves = [fcurve_compat.new_fcurve(action, prop, index=channel, action_group=grpname)
                 for prop, nbr_channels, grpname in props for channel in range(nbr_channels)]
  ```
- **Line 201** (find):
  ```python
  # before
  fcurve = action.fcurves.find(data_path=data_path, index=index)
  # after
  fcurve = fcurve_compat.find_fcurve(action, data_path, index=index)
  ```

## Caveats

- The new-API code paths in `fcurve_compat.py` are written against Blender's
  documented 4.4+ layered-action model (`layers` / `strips` / `channelbags` /
  `slots`, and the `strip.channelbag(slot, ensure=True)` convenience method). This
  has not been executed inside Blender 5.2 yet - test the retargeting flow after
  wiring it in, and watch the Blender console for any attribute-name mismatches
  if the API shifted further between 4.4 and 5.2.
- `new_fcurve()` auto-creates a slot via `action.slots.new(id_type='OBJECT', ...)`
  when none is passed in and the action has none yet. If you hit issues with
  shape-key or material animation (which use `id_type` other than `'OBJECT'`),
  pass an explicit `slot` instead of relying on that fallback.
- This shim does not fix every possible Blender-5.2 incompatibility in this addon
  - it only addresses the `Action.fcurves` API change identified in
    `script-reccs.md`. If retargeting still fails after this, re-diagnose from the
    new traceback.
