import asyncio
import os
from pathlib import Path
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from fs.router import get_active_workspace, IGNORED_NAMES
from ai.core.logger import logger

router = APIRouter(tags=["Workspace Watcher"])

active_subscribers: Set[WebSocket] = set()
observer: Observer = None
current_watched_path: str = None
loop_ref = None

class WorkspaceEventHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        global loop_ref
        if event.is_directory:
            return
        
        # Check ignored paths
        src = event.src_path
        for ign in IGNORED_NAMES:
            if f"{os.sep}{ign}{os.sep}" in src or src.endswith(f"{os.sep}{ign}"):
                return

        ws = str(get_active_workspace())
        rel = os.path.relpath(src, ws) if src.startswith(ws) else os.path.basename(src)

        payload = {
            "eventType": event.event_type,
            "filename": rel,
            "fullPath": src
        }

        if loop_ref and not loop_ref.is_closed():
            for ws_conn in list(active_subscribers):
                try:
                    asyncio.run_coroutine_threadsafe(
                        ws_conn.send_json(payload),
                        loop_ref
                    )
                except Exception:
                    pass

def ensure_watcher_running(path: str, loop):
    global observer, current_watched_path, loop_ref
    loop_ref = loop
    if observer is not None and current_watched_path == path:
        return
    
    if observer is not None:
        try:
            observer.stop()
            observer.join()
        except Exception:
            pass

    try:
        current_watched_path = path
        observer = Observer()
        observer.schedule(WorkspaceEventHandler(), path, recursive=True)
        observer.start()
    except Exception as e:
        logger.error(f"Failed to start watchdog on {path}: {e}")

@router.websocket("/workspace")
async def websocket_workspace(websocket: WebSocket):
    """Subscribes web clients to real-time file system change events."""
    await websocket.accept()
    active_subscribers.add(websocket)
    
    loop = asyncio.get_running_loop()
    ws_path = str(get_active_workspace())
    ensure_watcher_running(ws_path, loop)

    try:
        while True:
            # Keep connection alive with heartbeat / ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_subscribers.discard(websocket)
    except Exception as e:
        logger.error(f"Workspace watcher disconnect: {e}")
        active_subscribers.discard(websocket)
