"""
Compatibility shim for Blender's Action/F-curve API.

Blender 4.4 replaced the flat `Action.fcurves` collection with a layered model:
`action.layers -> strips -> channelbags -> fcurves`, where each channelbag is tied
to an action "slot" (needed because one Action can now be shared across multiple
data-blocks). Code written for Blender <4.4 that does
`action.fcurves.new(...)` / `action.fcurves.find(...)` / `for fc in action.fcurves`
raises `AttributeError: 'Action' object has no attribute 'fcurves'` on Blender 4.4+.

This module provides drop-in replacements that work on both API generations:
  - Blender < 4.4: `Action.fcurves` exists directly, so we just use it.
  - Blender >= 4.4: we walk layers/strips/channelbags, creating them as needed.

Usage (see instructions.md in this repo for exact call-site edits):

    from . import fcurve_compat as fc_compat

    # read/iterate
    for fcurve in fc_compat.get_action_fcurves(obj.animation_data):
        ...

    # create
    curve = fc_compat.new_fcurve(action, data_path, index=0, action_group=grpname,
                                  slot=fc_compat.get_action_slot(animation_data))

    # find
    fcurve = fc_compat.find_fcurve(action, data_path, index=0, slot=slot)

    # remove
    fc_compat.remove_fcurve(action, fcurve, slot=slot)
"""


def get_action_slot(animation_data):
    """
    Return the ActionSlot assigned to `animation_data`.

    On Blender < 4.4, AnimData has no `action_slot` attribute (there is no slot
    concept), so this returns None - which the rest of this module treats as
    "match every channelbag" when searching for fcurves.
    """
    if animation_data is None:
        return None
    return getattr(animation_data, 'action_slot', None)


def _ensure_slot(action, slot):
    """
    Return a usable slot for `action`, creating one if necessary (new API only).
    Only called when we already know we're on the new (>= 4.4) API.
    """
    if slot is not None:
        return slot
    if action.slots:
        return action.slots[0]
    # No slot exists yet - create one. id_type is a best-effort default; if you
    # need a specific id_type (e.g. 'OBJECT' vs 'KEY'), pass an explicit slot in
    # instead of relying on this fallback.
    return action.slots.new(id_type='OBJECT', name='Slot')


def iter_channelbags(action, slot=None):
    """
    Yield every channelbag in `action` whose slot matches `slot`
    (or every channelbag, if `slot` is None).

    No-op / yields nothing on Blender < 4.4, where channelbags don't exist -
    callers should check `hasattr(action, 'fcurves')` first (the helpers below
    do this for you).
    """
    for layer in getattr(action, 'layers', []):
        for strip in layer.strips:
            channelbags = getattr(strip, 'channelbags', None)
            if not channelbags:
                continue
            for channelbag in channelbags:
                if slot is None or channelbag.slot == slot:
                    yield channelbag


def _ensure_channelbag(action, slot):
    """
    Get-or-create the channelbag for `slot` in `action` (new API only).
    Creates the first layer/strip if the action doesn't have any yet.
    """
    if action.layers:
        layer = action.layers[0]
    else:
        layer = action.layers.new(name='Layer')

    if layer.strips:
        strip = layer.strips[0]
    else:
        strip = layer.strips.new(type='KEYFRAME')

    # KeyframeActionStrip exposes channelbag(slot, ensure=True) specifically for
    # this kind of script migration.
    return strip.channelbag(slot, ensure=True)


def get_fcurves(action, slot=None):
    """
    Return a flat list of all fcurves in `action` (optionally restricted to
    `slot` on the new API). Equivalent to the old `list(action.fcurves)`.
    """
    if action is None:
        return []
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    fcurves = []
    for channelbag in iter_channelbags(action, slot):
        fcurves.extend(channelbag.fcurves)
    return fcurves


def get_action_fcurves(animation_data):
    """
    Convenience wrapper: return the fcurves for `animation_data.action`,
    automatically using `animation_data`'s assigned slot on the new API.
    Equivalent to the old `list(obj.animation_data.action.fcurves)`.
    """
    if animation_data is None or animation_data.action is None:
        return []
    slot = get_action_slot(animation_data)
    return get_fcurves(animation_data.action, slot)


def new_fcurve(action, data_path, index=0, action_group=None, slot=None):
    """
    Create and return a new fcurve on `action`.
    Equivalent to the old `action.fcurves.new(data_path, index=index, action_group=action_group)`.

    On the new API, `slot` is required if `action` doesn't already have exactly
    one slot to fall back on - pass `fcurve_compat.get_action_slot(animation_data)`
    from the caller.
    """
    if hasattr(action, 'fcurves'):
        if action_group:
            return action.fcurves.new(data_path, index=index, action_group=action_group)
        return action.fcurves.new(data_path, index=index)

    slot = _ensure_slot(action, slot)
    channelbag = _ensure_channelbag(action, slot)
    if action_group:
        return channelbag.fcurves.new(data_path, index=index, action_group=action_group)
    return channelbag.fcurves.new(data_path, index=index)


def find_fcurve(action, data_path, index=0, slot=None):
    """
    Find and return an existing fcurve on `action` matching `data_path`/`index`,
    or None if not found. Equivalent to the old
    `action.fcurves.find(data_path=data_path, index=index)`.
    """
    if action is None:
        return None
    if hasattr(action, 'fcurves'):
        return action.fcurves.find(data_path=data_path, index=index)
    for channelbag in iter_channelbags(action, slot):
        fcurve = channelbag.fcurves.find(data_path=data_path, index=index)
        if fcurve is not None:
            return fcurve
    return None


def remove_fcurve(action, fcurve, slot=None):
    """
    Remove `fcurve` from `action`.
    Equivalent to the old `action.fcurves.remove(fcurve)`.
    """
    if hasattr(action, 'fcurves'):
        action.fcurves.remove(fcurve)
        return
    for channelbag in iter_channelbags(action, slot):
        if fcurve in list(channelbag.fcurves):
            channelbag.fcurves.remove(fcurve)
            return
