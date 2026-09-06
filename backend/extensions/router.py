import httpx
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from pydantic import BaseModel

router = APIRouter(prefix="/extensions", tags=["Extensions"])

# In-memory installed extensions for the server codespace
installed_extensions: Dict[str, dict] = {}

class InstallRequest(BaseModel):
    namespace: str
    name: str

class ToggleRequest(BaseModel):
    id: str
    enabled: bool

@router.get("/search")
async def search_extensions(
    query: str = Query(""),
    sortBy: Optional[str] = Query("relevance"),
    sortOrder: Optional[str] = Query("desc"),
    offset: Optional[int] = Query(0)
):
    """Searches the Open VSX marketplace registry."""
    url = "https://open-vsx.org/api/-/search"
    params = {
        "query": query,
        "sortBy": sortBy,
        "sortOrder": sortOrder,
        "offset": offset,
        "size": 20
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, params=params)
            if res.status_code == 200:
                return res.json()
            return {"extensions": [], "totalSize": 0}
    except Exception:
        return {"extensions": [], "totalSize": 0}

@router.get("/installed")
async def get_installed_extensions():
    """Returns list of installed extensions."""
    return list(installed_extensions.values())

@router.post("/install")
async def install_extension(req: InstallRequest):
    """Installs an extension into the codespace."""
    ext_id = f"{req.namespace}.{req.name}"
    installed_extensions[ext_id] = {
        "id": ext_id,
        "namespace": req.namespace,
        "name": req.name,
        "enabled": True
    }
    return {"ok": True, "id": ext_id}

@router.delete("/uninstall/{ext_id}")
async def uninstall_extension(ext_id: str):
    """Uninstalls an extension."""
    installed_extensions.pop(ext_id, None)
    return {"ok": True}

@router.post("/toggle")
async def toggle_extension(req: ToggleRequest):
    """Toggles extension state."""
    if req.id in installed_extensions:
        installed_extensions[req.id]["enabled"] = req.enabled
    return {"ok": True}
