#!/Users/james/ComfyUI/.venv/bin/python3
"""
Batch image → STL using Hunyuan3D v2.1 via ComfyUI internals (no server required).
Includes automatic mesh repair via PyMeshFix after extraction.

Usage:
  ./H3-pipeline.py <input_dir> <output_dir> [options]

Options:
  --steps N               KSampler steps            (default: 30)
  --cfg F                 CFG scale                 (default: 5.0)
  --resolution N          Latent resolution         (default: 8192)
  --octree-resolution N   VAE octree resolution     (default: 256)
  --num-chunks N          VAE decode chunks         (default: 8000)
  --threshold F           Surface-net threshold     (default: 0.6)
  --seed N                Fixed seed, -1 = random   (default: -1)
  --ext EXTS              Image extensions          (default: png,jpg,jpeg,webp)
  --no-skip               Re-process even if STL already exists
  --no-repair             Skip PyMeshFix repair step (write raw mesh)
"""

import sys, os, struct, random, argparse
from pathlib import Path

# ── ComfyUI paths ────────────────────────────────────────────────────────────
COMFYUI_SRC    = "/Users/james/ComfyUI-Installs/ComfyUI/ComfyUI"
COMFYUI_MODELS = "/Users/james/ComfyUI/models"
CHECKPOINT     = "hunyuan_3d_v2.1.safetensors"

sys.path.insert(0, COMFYUI_SRC)

import folder_paths
folder_paths.folder_names_and_paths["checkpoints"][0].insert(
    0, os.path.join(COMFYUI_MODELS, "checkpoints")
)

import torch
import numpy as np
from PIL import Image
import pymeshfix

import comfy.sd
import comfy.model_management
from comfy_extras.nodes_model_advanced import ModelSamplingAuraFlow
from comfy_extras.nodes_hunyuan3d import voxel_to_mesh_surfnet
from comfy_api.latest import Types
from nodes import common_ksampler


# ── STL writer ───────────────────────────────────────────────────────────────

def save_stl(vertices, faces, filepath):
    """Write binary STL from (N,3) and (M,3) numpy float32/int arrays."""
    verts = vertices.astype(np.float32)
    tris  = faces.astype(np.int64)

    v0 = verts[tris[:, 0]]
    v1 = verts[tris[:, 1]]
    v2 = verts[tris[:, 2]]

    normals = np.cross(v1 - v0, v2 - v0)
    lengths = np.linalg.norm(normals, axis=1, keepdims=True)
    lengths[lengths == 0] = 1.0
    normals /= lengths

    with open(filepath, "wb") as f:
        f.write(b"\x00" * 80)
        f.write(struct.pack("<I", len(tris)))
        for i in range(len(tris)):
            f.write(struct.pack("<fff", *normals[i]))
            f.write(struct.pack("<fff", *v0[i]))
            f.write(struct.pack("<fff", *v1[i]))
            f.write(struct.pack("<fff", *v2[i]))
            f.write(b"\x00\x00")


# ── Mesh repair ───────────────────────────────────────────────────────────────

def repair_mesh(verts_np, faces_np):
    """Run PyMeshFix repair. Returns (verts, faces) numpy arrays."""
    mf = pymeshfix.MeshFix(verts_np.astype(np.float32), faces_np.astype(np.int32))
    mf.repair()
    return mf.v, mf.f


# ── Image loading ─────────────────────────────────────────────────────────────

def load_image_tensor(path):
    """Load image as a ComfyUI-style (1, H, W, 3) float32 [0,1] tensor.
    RGBA images are composited onto a white background."""
    img = Image.open(path).convert("RGBA")
    bg  = Image.new("RGB", img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    arr = np.array(bg).astype(np.float32) / 255.0
    return torch.from_numpy(arr).unsqueeze(0)   # (1, H, W, 3)


# ── Pipeline ──────────────────────────────────────────────────────────────────

def process_image(img_path, out_path, model, clip_vision, vae, args):
    seed = args.seed if args.seed >= 0 else random.randint(0, 2**32 - 1)
    print(f"  seed={seed}")

    # Step 1: CLIP vision encode
    print("  CLIP encode...")
    image_tensor = load_image_tensor(img_path)
    clip_output  = clip_vision.encode_image(image_tensor, crop=True)

    # Step 2: Hunyuan3D conditioning
    embeds   = clip_output.last_hidden_state
    positive = [[embeds, {}]]
    negative = [[torch.zeros_like(embeds), {}]]

    # Step 3: Empty latent
    latent_tensor = torch.zeros(
        [1, 64, args.resolution],
        device=comfy.model_management.intermediate_device(),
    )
    latent = {"samples": latent_tensor, "type": "hunyuan3dv2"}

    # Step 4: KSampler
    print(f"  Sampling ({args.steps} steps, cfg={args.cfg})...")
    latent_out, = common_ksampler(
        model, seed, args.steps, args.cfg,
        "euler", "normal",
        positive, negative, latent,
        denoise=1.0,
    )

    # Step 5: VAE decode → voxel grid
    print(f"  VAE decode (octree={args.octree_resolution})...")
    raw_voxels = vae.decode(
        latent_out["samples"],
        vae_options={
            "num_chunks":        args.num_chunks,
            "octree_resolution": args.octree_resolution,
        },
    )
    voxel_obj = Types.VOXEL(raw_voxels)

    # Step 6: Voxel → mesh via surface-net
    print("  Mesh extraction (surface net)...")
    all_verts, all_faces = [], []
    offset = 0
    for vox_slice in voxel_obj.data:
        v, f = voxel_to_mesh_surfnet(vox_slice, threshold=args.threshold)
        all_verts.append(v)
        all_faces.append(f + offset)
        offset += v.shape[0]

    vertices = torch.cat(all_verts).cpu().numpy()
    faces    = torch.cat(all_faces).cpu().numpy()

    raw_verts = len(vertices)
    raw_faces = len(faces)
    print(f"  Raw mesh: {raw_verts:,} verts  {raw_faces:,} faces")

    # Step 7: PyMeshFix repair
    if not args.no_repair:
        print("  Repairing mesh (PyMeshFix)...")
        vertices, faces = repair_mesh(vertices, faces)
        print(f"  Repaired: {len(vertices):,} verts  {len(faces):,} faces"
              f"  (Δv={len(vertices)-raw_verts:+,}  Δf={len(faces)-raw_faces:+,})")
    else:
        print("  Repair skipped (--no-repair)")

    # Step 8: Write binary STL
    print(f"  Saving → {out_path.name}")
    save_stl(vertices, faces, out_path)
    print(f"  OK")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(
        description="Batch image → STL via Hunyuan3D v2.1 with mesh repair",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    ap.add_argument("input_dir",  help="Directory of input images")
    ap.add_argument("output_dir", help="Directory for output STL files")
    ap.add_argument("--steps",             type=int,   default=30)
    ap.add_argument("--cfg",               type=float, default=5.0)
    ap.add_argument("--resolution",        type=int,   default=8192,
                    help="Latent resolution (3072 = faster/lower quality)")
    ap.add_argument("--octree-resolution", type=int,   default=256,
                    help="VAE octree resolution (higher = finer mesh)")
    ap.add_argument("--num-chunks",        type=int,   default=8000)
    ap.add_argument("--threshold",         type=float, default=0.6,
                    help="Surface-net iso threshold (0.5–0.7)")
    ap.add_argument("--seed",              type=int,   default=-1,
                    help="Fixed seed, or -1 for a random seed per image")
    ap.add_argument("--ext",               default="png,jpg,jpeg,webp",
                    help="Comma-separated image extensions to process")
    ap.add_argument("--no-skip",           action="store_true",
                    help="Re-process images even if the output STL already exists")
    ap.add_argument("--no-repair",         action="store_true",
                    help="Skip PyMeshFix repair and write the raw mesh")
    args = ap.parse_args()

    in_dir  = Path(args.input_dir)
    out_dir = Path(args.output_dir)

    if not in_dir.is_dir():
        sys.exit(f"ERROR: input directory not found: {in_dir}")
    out_dir.mkdir(parents=True, exist_ok=True)

    exts   = {f".{e.strip().lstrip('.')}" for e in args.ext.split(",")}
    images = sorted(p for p in in_dir.iterdir()
                    if p.is_file() and p.suffix.lower() in exts)

    if not images:
        sys.exit(f"No images found in {in_dir} matching extensions {exts}")

    print(f"Found {len(images)} image(s).")
    print(f"Loading model — {CHECKPOINT}  (first run ~30 s)...")

    ckpt_path = os.path.join(COMFYUI_MODELS, "checkpoints", CHECKPOINT)
    model, _clip, vae, clip_vision = comfy.sd.load_checkpoint_guess_config(
        ckpt_path,
        output_vae=True,
        output_clip=False,
        output_clipvision=True,
    )

    model = ModelSamplingAuraFlow().patch_aura(model, shift=1.0)[0]

    comfy.model_management.load_models_gpu([model])
    print("Model ready.\n")

    errors = []
    for idx, img_path in enumerate(images, 1):
        out_path = out_dir / f"{img_path.stem}.stl"

        if out_path.exists() and not args.no_skip:
            print(f"[{idx}/{len(images)}] Skip  {img_path.name}  (output exists)")
            continue

        print(f"[{idx}/{len(images)}] {img_path.name}")
        try:
            process_image(img_path, out_path, model, clip_vision, vae, args)
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            errors.append((img_path.name, str(exc)))
        print()

    print(f"Done. STLs written to: {out_dir}")
    if errors:
        print(f"\n{len(errors)} error(s):")
        for name, msg in errors:
            print(f"  {name}: {msg}")


if __name__ == "__main__":
    main()
