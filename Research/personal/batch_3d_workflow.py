#!/usr/bin/env python3
"""
ComfyUI batch processor for 3D model workflows.
Loads images from input directory and queues them through the workflow.
"""

import os
import json
import requests
from pathlib import Path
import time
import sys

# Configuration
COMFY_URL = "http://127.0.0.1:8000"
WORKFLOW_PATH = "/Users/james/ComfyUI/user/default/workflows/26-06-17-3D.json"
IMAGE_DIR = "/Users/james/Desktop/comfy-in"
OUTPUT_DIR = "/Users/james/Desktop/comfy-out"
LOAD_IMAGE_NODE_ID = "2"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def convert_workflow_to_prompt(workflow_data):
    """Convert ComfyUI app format to API prompt format."""
    # UI-only node types that shouldn't be sent to the API
    ui_only_nodes = {"MarkdownNote", "Note", "Reroute", "PrimitiveNode"}

    prompt = {}
    for node in workflow_data["nodes"]:
        # Skip UI-only nodes
        if node["type"] in ui_only_nodes:
            continue

        node_id = str(node["id"])
        prompt[node_id] = {
            "class_type": node["type"],
            "inputs": {}
        }

        # Build inputs from widget values and linked inputs
        if "widgets_values" in node and node["widgets_values"]:
            widget_names = [inp.get("name") for inp in node.get("inputs", []) if inp.get("type") == "COMBO" or inp.get("widget")]
            for i, value in enumerate(node["widgets_values"]):
                if i < len(widget_names):
                    prompt[node_id]["inputs"][widget_names[i]] = value

        # Add linked inputs
        for link in workflow_data.get("links", []):
            source_node_id, source_slot, target_node_id, target_slot = link[1], link[2], link[3], link[4]
            if target_node_id == node["id"]:
                target_input_name = node["inputs"][target_slot]["name"]
                prompt[node_id]["inputs"][target_input_name] = [source_node_id, source_slot]

    return prompt

def wait_for_completion(prompt_id, timeout=3600):
    """Poll for workflow completion."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{COMFY_URL}/history/{prompt_id}")
            if response.status_code == 200:
                history = response.json()
                if prompt_id in history:
                    print(f"    ✓ Completed")
                    return True
        except Exception as e:
            print(f"    (polling...)")
        time.sleep(2)
    print(f"    ✗ Timeout waiting for completion")
    return False

def process_images():
    """Load workflow and process all images."""
    try:
        with open(WORKFLOW_PATH) as f:
            base_workflow = json.load(f)
    except FileNotFoundError:
        print(f"✗ Workflow not found: {WORKFLOW_PATH}")
        sys.exit(1)

    # Get list of images
    image_patterns = ["*.png", "*.jpg", "*.jpeg", "*.webp"]
    image_files = []
    for pattern in image_patterns:
        image_files.extend(sorted(Path(IMAGE_DIR).glob(pattern)))

    if not image_files:
        print(f"✗ No images found in {IMAGE_DIR}")
        sys.exit(1)

    print(f"Found {len(image_files)} images to process\n")

    # Process each image
    for idx, image_file in enumerate(image_files, 1):
        print(f"[{idx}/{len(image_files)}] Processing: {image_file.name}")

        # Make a copy of the workflow for this iteration
        workflow = json.loads(json.dumps(base_workflow))

        # Find and update the LoadImage node
        load_image_node = None
        for node in workflow["nodes"]:
            if node["id"] == int(LOAD_IMAGE_NODE_ID):
                load_image_node = node
                break

        if load_image_node is None:
            print(f"  ✗ Could not find LoadImage node with ID {LOAD_IMAGE_NODE_ID}")
            continue

        # Update the image filename in widgets_values
        load_image_node["widgets_values"][0] = image_file.name

        # Convert to API format
        prompt = convert_workflow_to_prompt(workflow)

        # Queue the workflow
        try:
            response = requests.post(
                f"{COMFY_URL}/prompt",
                json={"prompt": prompt}
            )

            if response.status_code == 200:
                result = response.json()
                prompt_id = result.get("prompt_id")
                print(f"  → Queued (ID: {prompt_id})")

                # Wait for completion before processing next image
                if prompt_id:
                    wait_for_completion(prompt_id)
            else:
                print(f"  ✗ Queue error: {response.status_code}")
                print(f"    {response.text}")
        except Exception as e:
            print(f"  ✗ Request failed: {e}")

        print()

    print("✓ All images processed!")

if __name__ == "__main__":
    print("ComfyUI Batch 3D Model Processor")
    print(f"Input:  {IMAGE_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Workflow: {WORKFLOW_PATH}")
    print(f"ComfyUI: {COMFY_URL}\n")

    process_images()
