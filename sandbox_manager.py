import os
import json
from typing import List, Dict, Any, Optional

# Root directory of the sandbox (always within /home/rathanan/javis/sandbox)
SANDBOX_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "sandbox"))

DATA_DIR = os.path.join(SANDBOX_ROOT, "data")
WORKSPACE_DIR = os.path.join(SANDBOX_ROOT, "workspace")
OUTPUT_DIR = os.path.join(SANDBOX_ROOT, "output")
SESSIONS_DIR = os.path.join(SANDBOX_ROOT, "sessions")

# Whitelist file extensions for safe operations
ALLOWED_EXTENSIONS = {
    ".txt", ".json", ".md", ".csv", ".html", 
    ".png", ".jpg", ".jpeg", ".pdf", ".log"
}


def ensure_sandbox_dirs():
    """Ensure all required sandbox directories exist."""
    for folder in [SANDBOX_ROOT, DATA_DIR, WORKSPACE_DIR, OUTPUT_DIR, SESSIONS_DIR]:
        os.makedirs(folder, exist_ok=True)


class SandboxSecurityException(Exception):
    """Raised when an operation attempts to breach the sandbox enclosure."""
    pass


def validate_path(relative_or_abs_path: str, allow_create_parent: bool = False) -> str:
    """
    Validate that the given path resides strictly within the sandbox enclosure.
    Prevents path traversal attacks (e.g. ../../) and access to root system files.
    """
    ensure_sandbox_dirs()
    
    # Strip leading slashes to prevent absolute path escapes if given relatively
    cleaned = relative_or_abs_path.strip()
    if os.path.isabs(cleaned):
        target = os.path.abspath(cleaned)
    else:
        target = os.path.abspath(os.path.join(SANDBOX_ROOT, cleaned))

    # Canonical path comparison (resolve symlinks)
    real_sandbox = os.path.realpath(SANDBOX_ROOT)
    real_target = os.path.realpath(target)

    # Check that real_target starts with real_sandbox
    common_prefix = os.path.commonpath([real_sandbox, real_target])
    if common_prefix != real_sandbox:
        raise SandboxSecurityException(
            f"SECURITY BREACH: Path '{relative_or_abs_path}' escapes sandbox enclosure. Access denied."
        )

    # Check extension
    _, ext = os.path.splitext(target)
    if ext and ext.lower() not in ALLOWED_EXTENSIONS:
        raise SandboxSecurityException(
            f"SECURITY RESTRICTION: Extension '{ext}' is not permitted in Sandbox. Allowed: {sorted(list(ALLOWED_EXTENSIONS))}"
        )

    if allow_create_parent:
        os.makedirs(os.path.dirname(target), exist_ok=True)

    return target


def read_file(relative_path: str) -> Dict[str, Any]:
    """Read contents of a file inside the sandbox."""
    try:
        path = validate_path(relative_path)
        if not os.path.exists(path):
            return {"success": False, "error": f"File '{relative_path}' not found in sandbox."}
        if not os.path.isfile(path):
            return {"success": False, "error": f"Path '{relative_path}' is not a file."}

        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        # If it's a JSON file, parse for structured display
        parsed_json = None
        if path.endswith(".json"):
            try:
                parsed_json = json.loads(content)
            except Exception:
                pass

        return {
            "success": True,
            "path": os.path.relpath(path, SANDBOX_ROOT),
            "size_bytes": len(content.encode("utf-8")),
            "content": content,
            "json_data": parsed_json
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def write_file(relative_path: str, content: str) -> Dict[str, Any]:
    """Write text or JSON content to a file inside the sandbox."""
    try:
        path = validate_path(relative_path, allow_create_parent=True)
        
        # Guard: Do not overwrite data directory templates unless explicitly in workspace or output
        rel_to_sandbox = os.path.relpath(path, SANDBOX_ROOT)
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "success": True,
            "path": rel_to_sandbox,
            "size_bytes": len(content.encode("utf-8")),
            "message": f"Successfully wrote {len(content.encode('utf-8'))} bytes to '{rel_to_sandbox}'."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_file(relative_path: str) -> Dict[str, Any]:
    """
    Delete a temporary file strictly within sandbox/workspace/.
    Enforces Non-destructive rule: deletion outside workspace/ is strictly prohibited.
    """
    try:
        path = validate_path(relative_path)
        real_workspace = os.path.realpath(WORKSPACE_DIR)
        real_target = os.path.realpath(path)

        # Enforce that real_target must reside strictly within real_workspace
        common = os.path.commonpath([real_workspace, real_target])
        if common != real_workspace or real_target == real_workspace:
            raise SandboxSecurityException(
                f"SECURITY RESTRICTION: Non-destructive policy enforced. Deletion is strictly prohibited outside 'sandbox/workspace/'. Attempted path: '{relative_path}'"
            )

        if not os.path.exists(path):
            return {"success": False, "error": f"File '{relative_path}' not found in workspace."}

        if os.path.isdir(path):
            raise SandboxSecurityException("Directories cannot be deleted via delete_file.")

        os.remove(path)
        return {
            "success": True,
            "path": os.path.relpath(path, SANDBOX_ROOT),
            "message": f"Successfully deleted temporary file '{relative_path}' from workspace."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def list_files(subfolder: str = "") -> Dict[str, Any]:
    """List all files and folders inside the sandbox or a specified subfolder."""
    try:
        base_dir = validate_path(subfolder)
        if not os.path.exists(base_dir):
            return {"success": False, "error": f"Directory '{subfolder}' does not exist in sandbox."}

        items = []
        for root, dirs, files in os.walk(base_dir):
            rel_root = os.path.relpath(root, SANDBOX_ROOT)
            if rel_root == ".":
                rel_root = ""
            for d in dirs:
                items.append({
                    "name": d,
                    "type": "directory",
                    "path": os.path.join(rel_root, d) if rel_root else d
                })
            for f in files:
                file_path = os.path.join(root, f)
                items.append({
                    "name": f,
                    "type": "file",
                    "size_bytes": os.path.getsize(file_path),
                    "path": os.path.join(rel_root, f) if rel_root else f
                })

        return {
            "success": True,
            "subfolder": subfolder,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_sandbox_stats() -> Dict[str, Any]:
    """Return health and storage stats of the sandbox."""
    ensure_sandbox_dirs()
    total_files = 0
    total_size = 0
    for root, _, files in os.walk(SANDBOX_ROOT):
        for f in files:
            p = os.path.join(root, f)
            total_files += 1
            total_size += os.path.getsize(p)
    return {
        "sandbox_root": SANDBOX_ROOT,
        "total_files": total_files,
        "total_size_bytes": total_size,
        "data_dir": DATA_DIR,
        "workspace_dir": WORKSPACE_DIR,
        "output_dir": OUTPUT_DIR,
        "sessions_dir": SESSIONS_DIR
    }


# Automatically ensure directories on import
ensure_sandbox_dirs()
