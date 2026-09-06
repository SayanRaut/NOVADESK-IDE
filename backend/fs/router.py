import os
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel

router = APIRouter(prefix="/fs", tags=["Server File System"])

# Server workspaces storage root directory
SERVER_STORAGE_DIR = Path(__file__).resolve().parents[2] / "server_workspaces"
SERVER_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Active workspace path tracked in memory
ACTIVE_WORKSPACE: Optional[Path] = None

# Fallback starter workspace if none exists yet
DEFAULT_WORKSPACE_NAME = "default-project"

def get_active_workspace() -> Path:
    global ACTIVE_WORKSPACE
    if ACTIVE_WORKSPACE is None or not ACTIVE_WORKSPACE.exists():
        default_dir = SERVER_STORAGE_DIR / DEFAULT_WORKSPACE_NAME
        if not default_dir.exists():
            default_dir.mkdir(parents=True, exist_ok=True)
            # Create a simple starter file
            readme = default_dir / "README.md"
            readme.write_text("# Welcome to NovaDesk Codespace\n\nStart creating files or use the AI project generator to scaffold a new application!\n", encoding="utf-8")
        ACTIVE_WORKSPACE = default_dir
    return ACTIVE_WORKSPACE

def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    try:
        base_resolved = base_dir.resolve()
        target_resolved = target_path.resolve()
        return target_resolved == base_resolved or base_resolved in target_resolved.parents
    except Exception:
        return False

IGNORED_NAMES = {'.git', 'node_modules', '.venv', '__pycache__', 'dist', 'build', '.DS_Store', 'Thumbs.db'}

class WriteFileRequest(BaseModel):
    path: str
    content: str

class CreateEntryRequest(BaseModel):
    parentPath: str
    name: str
    content: Optional[str] = ""

class RenameRequest(BaseModel):
    oldPath: str
    newName: str

class DeleteRequest(BaseModel):
    targetPath: str

class DuplicateRequest(BaseModel):
    targetPath: str

class SetWorkspaceRequest(BaseModel):
    rootPath: str

class CreateCodespaceRequest(BaseModel):
    name: str
    template: Optional[str] = "web"

@router.get("/codespaces")
async def list_codespaces():
    """List all available server codespaces."""
    codespaces = []
    for item in SERVER_STORAGE_DIR.iterdir():
        if item.is_dir() and item.name not in IGNORED_NAMES:
            # Count files
            file_count = 0
            for root, dirs, files in os.walk(item):
                dirs[:] = [d for d in dirs if d not in IGNORED_NAMES]
                file_count += len(files)
            
            # Check template/type
            stack = "Custom"
            if (item / "package.json").exists():
                stack = "React / Node"
            elif (item / "main.py").exists() or (item / "requirements.txt").exists():
                stack = "Python"
            elif (item / "index.html").exists():
                stack = "Web (HTML/JS)"

            mtime = os.path.getmtime(item)
            codespaces.append({
                "name": item.name,
                "path": str(item),
                "fileCount": file_count,
                "stack": stack,
                "updatedAt": mtime,
                "isActive": ACTIVE_WORKSPACE is not None and item.resolve() == ACTIVE_WORKSPACE.resolve()
            })
    
    codespaces.sort(key=lambda x: x["updatedAt"], reverse=True)
    return codespaces

@router.post("/codespaces")
async def create_codespace(req: CreateCodespaceRequest):
    """Create a new server codespace."""
    clean_name = req.name.strip().replace(" ", "-").lower()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Invalid codespace name")
    
    target_dir = SERVER_STORAGE_DIR / clean_name
    if target_dir.exists():
        import time
        clean_name = f"{clean_name}-{int(time.time())}"
        target_dir = SERVER_STORAGE_DIR / clean_name

    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Scaffold initial files based on template
    if req.template == "python":
        (target_dir / "main.py").write_text('def main():\n    print("Hello from NovaDesk!")\n\nif __name__ == "__main__":\n    main()\n', encoding="utf-8")
        (target_dir / "requirements.txt").write_text("# Python dependencies\n", encoding="utf-8")
        (target_dir / "README.md").write_text(f"# {clean_name}\n\nPython project created with NovaDesk.\n", encoding="utf-8")
    elif req.template == "html":
        (target_dir / "index.html").write_text(f'<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>{clean_name}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>{clean_name}</h1>\n  <p>Your web prototype is ready.</p>\n  <script src="script.js"></script>\n</body>\n</html>\n', encoding="utf-8")
        (target_dir / "style.css").write_text('body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }\n', encoding="utf-8")
        (target_dir / "script.js").write_text('console.log("Ready!");\n', encoding="utf-8")
        (target_dir / "README.md").write_text(f"# {clean_name}\n\nHTML/CSS/JS project.\n", encoding="utf-8")
    elif req.template in ("nextjs", "next"):
        (target_dir / "package.json").write_text('{\n  "name": "' + clean_name + '",\n  "private": true,\n  "version": "0.1.0",\n  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },\n  "dependencies": { "next": "^15.1.0", "react": "^19.0.0", "react-dom": "^19.0.0", "lucide-react": "^0.460.0" },\n  "devDependencies": { "typescript": "^5.6.0", "tailwindcss": "^3.4.16" }\n}\n', encoding="utf-8")
        app_dir = target_dir / "app"
        app_dir.mkdir(parents=True, exist_ok=True)
        (app_dir / "layout.tsx").write_text('export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang="en"><body style={{ margin: 0, background: "#030712", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>{children}</body></html>);\n}\n', encoding="utf-8")
        (app_dir / "page.tsx").write_text(f'export default function Home() {{\n  return (\n    <main style={{ padding: "4rem", textAlign: "center" }}>\n      <h1 style={{ fontSize: "2.5rem", fontWeight: 800 }}>{clean_name}</h1>\n      <p style={{ color: "#94a3b8" }}>Fullstack Next.js 15 application running in NovaDesk Cloud.</p>\n    </main>\n  );\n}}\n', encoding="utf-8")
        (target_dir / "README.md").write_text(f"# {clean_name}\n\nNext.js 15 App Router project in NovaDesk Cloud.\n\n```bash\nnpm run dev\n```\n", encoding="utf-8")
    else:
        # Default web/react starter
        (target_dir / "package.json").write_text('{\n  "name": "' + clean_name + '",\n  "private": true,\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": { "dev": "vite", "build": "vite build" }\n}\n', encoding="utf-8")
        (target_dir / "index.html").write_text('<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>' + clean_name + '</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>\n', encoding="utf-8")
        (target_dir / "README.md").write_text(f"# {clean_name}\n\nWeb app created in NovaDesk Cloud.\n", encoding="utf-8")

    global ACTIVE_WORKSPACE
    ACTIVE_WORKSPACE = target_dir
    return {"ok": True, "name": clean_name, "path": str(target_dir)}

@router.delete("/codespaces/{name}")
async def delete_codespace(name: str):
    """Delete a server codespace."""
    target_dir = SERVER_STORAGE_DIR / name
    if not target_dir.exists() or not is_safe_path(SERVER_STORAGE_DIR, target_dir):
        raise HTTPException(status_code=404, detail="Codespace not found")
    
    shutil.rmtree(target_dir, ignore_errors=True)
    
    global ACTIVE_WORKSPACE
    if ACTIVE_WORKSPACE and ACTIVE_WORKSPACE.resolve() == target_dir.resolve():
        ACTIVE_WORKSPACE = None
        get_active_workspace()
    
    return {"ok": True}

@router.get("/workspace")
async def get_workspace_info():
    """Get active workspace info."""
    ws = get_active_workspace()
    return {
        "name": ws.name,
        "path": str(ws),
        "exists": ws.exists()
    }

@router.post("/set-workspace")
async def set_workspace(req: SetWorkspaceRequest):
    """Set the active workspace."""
    global ACTIVE_WORKSPACE
    target = Path(req.rootPath)
    if not target.is_absolute():
        target = SERVER_STORAGE_DIR / req.rootPath
    
    if not target.exists():
        target.mkdir(parents=True, exist_ok=True)
    
    ACTIVE_WORKSPACE = target
    return {"ok": True, "path": str(target), "name": target.name}

@router.get("/tree")
async def read_directory(directoryPath: Optional[str] = Query(None)):
    """Read directory entries for the file explorer."""
    ws = get_active_workspace()
    
    if directoryPath and directoryPath.strip():
        dir_path = Path(directoryPath)
        if not dir_path.is_absolute():
            dir_path = ws / directoryPath
    else:
        dir_path = ws

    if not dir_path.exists():
        return []

    entries = []
    try:
        with os.scandir(dir_path) as it:
            for entry in it:
                if entry.name in IGNORED_NAMES:
                    continue
                is_dir = entry.is_dir()
                entries.append({
                    "name": entry.name,
                    "isDirectory": is_dir,
                    "path": str(Path(entry.path))
                })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read directory: {str(e)}")

    entries.sort(key=lambda x: (not x["isDirectory"], x["name"].lower()))
    return entries

@router.get("/read")
async def read_file(filePath: str = Query(...)):
    """Read file content."""
    ws = get_active_workspace()
    target = Path(filePath)
    if not target.is_absolute():
        target = ws / filePath

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        content = target.read_text(encoding="utf-8")
        return {"content": content, "path": str(target)}
    except UnicodeDecodeError:
        return {"content": "[Binary file cannot be displayed]", "path": str(target), "isBinary": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/write")
async def write_file(req: WriteFileRequest):
    """Write or overwrite a file."""
    ws = get_active_workspace()
    target = Path(req.path)
    if not target.is_absolute():
        target = ws / req.path

    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(req.content, encoding="utf-8")
        return {"ok": True, "path": str(target)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-file")
async def create_file(req: CreateEntryRequest):
    """Create a new file."""
    ws = get_active_workspace()
    parent = Path(req.parentPath) if req.parentPath else ws
    if not parent.is_absolute():
        parent = ws / req.parentPath

    clean_name = req.name.strip()
    if not clean_name or "/" in clean_name or "\\" in clean_name:
        raise HTTPException(status_code=400, detail="Invalid file name")

    target = parent / clean_name
    if target.exists():
        raise HTTPException(status_code=400, detail="File already exists")

    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(req.content or "", encoding="utf-8")
        return {"ok": True, "path": str(target)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-folder")
async def create_folder(req: CreateEntryRequest):
    """Create a new folder."""
    ws = get_active_workspace()
    parent = Path(req.parentPath) if req.parentPath else ws
    if not parent.is_absolute():
        parent = ws / req.parentPath

    clean_name = req.name.strip()
    if not clean_name or "/" in clean_name or "\\" in clean_name:
        raise HTTPException(status_code=400, detail="Invalid folder name")

    target = parent / clean_name
    if target.exists():
        raise HTTPException(status_code=400, detail="Folder already exists")

    try:
        target.mkdir(parents=True, exist_ok=True)
        return {"ok": True, "path": str(target)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rename")
async def rename_entry(req: RenameRequest):
    """Rename a file or folder."""
    target = Path(req.oldPath)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Target does not exist")

    clean_name = req.newName.strip()
    if not clean_name or "/" in clean_name or "\\" in clean_name:
        raise HTTPException(status_code=400, detail="Invalid name")

    new_path = target.parent / clean_name
    try:
        target.rename(new_path)
        return {"ok": True, "path": str(new_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete")
async def delete_entry(req: DeleteRequest):
    """Delete a file or folder."""
    target = Path(req.targetPath)
    if not target.exists():
        return {"ok": True}

    try:
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/duplicate")
async def duplicate_entry(req: DuplicateRequest):
    """Duplicate a file."""
    target = Path(req.targetPath)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File does not exist")

    ext = target.suffix
    stem = target.stem
    parent = target.parent

    counter = 1
    new_path = parent / f"{stem} copy{ext}"
    while new_path.exists():
        counter += 1
        new_path = parent / f"{stem} copy {counter}{ext}"

    try:
        if target.is_dir():
            shutil.copytree(target, new_path)
        else:
            shutil.copy2(target, new_path)
        return {"ok": True, "path": str(new_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    parentPath: Optional[str] = Form(None)
):
    """Upload a file into the active codespace."""
    ws = get_active_workspace()
    parent = Path(parentPath) if parentPath else ws
    if not parent.is_absolute():
        parent = ws / (parentPath or "")

    target = parent / file.filename
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"ok": True, "path": str(target), "name": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_workspace(query: str = Query(...)):
    """Search text in files in the active codespace."""
    ws = get_active_workspace()
    normalized = query.strip().lower()
    if not normalized:
        return []

    matches = []
    for root, dirs, files in os.walk(ws):
        dirs[:] = [d for d in dirs if d not in IGNORED_NAMES]
        for f in files:
            if len(matches) >= 100:
                break
            file_path = Path(root) / f
            try:
                if file_path.stat().st_size > 1_000_000:
                    continue
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for idx, line in enumerate(content.splitlines(), start=1):
                    if normalized in line.lower():
                        matches.append({
                            "path": str(file_path),
                            "line": idx,
                            "preview": line.strip()[:160]
                        })
                        if len(matches) >= 100:
                            break
            except Exception:
                continue
    return matches
