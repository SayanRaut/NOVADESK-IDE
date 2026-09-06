import asyncio
import os
import subprocess
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from fs.router import get_active_workspace
from ai.core.logger import logger

router = APIRouter(prefix="/git", tags=["Server Git"])

def run_git(args: List[str], cwd: Optional[str] = None) -> str:
    working_dir = cwd or str(get_active_workspace())
    try:
        proc = subprocess.run(
            ["git"] + args,
            cwd=working_dir,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=(os.name == 'nt'),
            timeout=30
        )
        if proc.returncode != 0 and proc.stderr:
            if "status" not in args:
                logger.warning(f"Git command failed: {args} -> {proc.stderr}")
        return proc.stdout or proc.stderr or ""
    except Exception as e:
        logger.error(f"Git execution error: {e}")
        return ""

class AddRequest(BaseModel):
    filePath: str

class CommitRequest(BaseModel):
    message: str

class PushRequest(BaseModel):
    branch: str = "main"

class CheckoutRequest(BaseModel):
    branch: str
    isNew: Optional[bool] = False

class RemoteAddRequest(BaseModel):
    url: str

class DiffRequest(BaseModel):
    base: str
    compare: str

@router.get("/status")
async def git_status():
    """Returns git status porcelain format."""
    ws = get_active_workspace()
    if not (ws / ".git").exists():
        return {"status": None}
    
    out = run_git(["status", "--porcelain=v1", "--branch"])
    return {"status": out if out.strip() else ""}

@router.post("/init")
async def git_init():
    """Initializes a git repository."""
    out = run_git(["init"])
    return {"ok": True, "output": out}

@router.get("/log")
async def git_log(maxCount: Optional[int] = Query(50)):
    """Returns commit history."""
    ws = get_active_workspace()
    if not (ws / ".git").exists():
        return {"log": None}
    
    out = run_git(["log", "--pretty=format:%H|%s|%an|%ar", "-n", str(maxCount)])
    return {"log": out}

@router.get("/branches")
async def git_branches():
    """Returns branch list."""
    ws = get_active_workspace()
    if not (ws / ".git").exists():
        return {"branches": None}

    out = run_git(["branch", "-a"])
    return {"branches": out}

@router.post("/add")
async def git_add(req: AddRequest):
    """Stages a file."""
    run_git(["add", req.filePath])
    return {"ok": True}

@router.post("/add-all")
async def git_add_all():
    """Stages all changes."""
    run_git(["add", "."])
    return {"ok": True}

@router.post("/unstage")
async def git_unstage(req: AddRequest):
    """Unstages a file."""
    run_git(["reset", "HEAD", req.filePath])
    return {"ok": True}

@router.post("/commit")
async def git_commit(req: CommitRequest):
    """Creates a commit."""
    clean_msg = req.message.strip()
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Commit message required")
    
    out = run_git(["commit", "-m", clean_msg])
    return {"ok": True, "output": out}

@router.post("/push")
async def git_push(req: PushRequest):
    """Pushes branch to remote."""
    out = run_git(["push", "-u", "origin", req.branch])
    return {"ok": True, "output": out}

@router.post("/checkout")
async def git_checkout(req: CheckoutRequest):
    """Checkouts or creates a branch."""
    args = ["checkout", "-b", req.branch] if req.isNew else ["checkout", req.branch]
    out = run_git(args)
    return {"ok": True, "output": out}

@router.get("/diff")
async def git_diff(base: Optional[str] = None, compare: Optional[str] = None):
    """Returns git diff."""
    if base and compare:
        out = run_git(["diff", f"{base}..{compare}"])
    else:
        out = run_git(["diff"])
    return {"diff": out}

@router.get("/remote-url")
async def git_remote_url():
    """Gets origin remote url."""
    out = run_git(["config", "--get", "remote.origin.url"])
    return {"url": out.strip() if out else None}

@router.post("/remote-add")
async def git_remote_add(req: RemoteAddRequest):
    """Adds or updates origin remote."""
    try:
        run_git(["remote", "add", "origin", req.url])
    except Exception:
        run_git(["remote", "set-url", "origin", req.url])
    return {"ok": True}

@router.post("/remote-remove")
async def git_remote_remove():
    """Removes origin remote."""
    run_git(["remote", "remove", "origin"])
    return {"ok": True}
