import asyncio
import os
import sys
import uuid
import threading
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fs.router import get_active_workspace
from ai.core.logger import logger

router = APIRouter(tags=["Terminal"])

# Active PTY processes dictionary: session_id -> pty instance
active_ptys: Dict[str, any] = {}

def spawn_pty(cwd: Optional[str] = None, cols: int = 100, rows: int = 30):
    """Spawns a cross-platform PTY process."""
    working_dir = cwd if cwd and os.path.exists(cwd) else str(get_active_workspace())

    if sys.platform == "win32":
        try:
            import winpty
            shell_cmd = os.environ.get("COMSPEC", r"C:\Windows\System32\cmd.exe")
            # Prefer PowerShell if available
            ps_path = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
            if os.path.exists(ps_path):
                shell_cmd = ps_path
            
            pty = winpty.PTY(cols, rows)
            pty.spawn(shell_cmd, cwd=working_dir)
            return pty, "winpty"
        except Exception as e:
            logger.error(f"winpty spawn failed: {e}")
            raise
    else:
        # Unix/Linux/macOS pty
        import pty
        import fcntl
        import termios
        import struct

        master, slave = pty.openpty()
        shell = os.environ.get("SHELL", "/bin/bash")
        pid = os.fork()
        if pid == 0:
            os.close(master)
            os.chdir(working_dir)
            os.setsid()
            os.dup2(slave, 0)
            os.dup2(slave, 1)
            os.dup2(slave, 2)
            os.close(slave)
            os.execv(shell, [shell])
        else:
            os.close(slave)
            return (master, pid), "unix"

@router.websocket("/terminal")
async def websocket_terminal(websocket: WebSocket):
    """Bidirectional interactive Web Terminal over WebSocket."""
    await websocket.accept()
    loop = asyncio.get_running_loop()
    session_id = str(uuid.uuid4())
    stop_event = threading.Event()
    pty_obj = None
    pty_type = None

    try:
        while True:
            msg = await websocket.receive_json()
            action = msg.get("action")

            if action == "create":
                req_id = msg.get("id") or session_id
                cwd = msg.get("cwd")
                cols = msg.get("cols", 100)
                rows = msg.get("rows", 30)

                try:
                    pty_obj, pty_type = spawn_pty(cwd=cwd, cols=cols, rows=rows)
                    active_ptys[req_id] = pty_obj
                    session_id = req_id

                    await websocket.send_json({"type": "created", "id": session_id})

                    # Background thread to continuously read from PTY and stream to WebSocket
                    def read_loop(pty_instance, sid, ptype):
                        if ptype == "winpty":
                            while not stop_event.is_set() and pty_instance.isalive():
                                try:
                                    data = pty_instance.read()
                                    if data:
                                        asyncio.run_coroutine_threadsafe(
                                            websocket.send_json({"type": "data", "id": sid, "data": data}),
                                            loop
                                        )
                                except Exception:
                                    break
                        else:
                            master_fd, pid = pty_instance
                            while not stop_event.is_set():
                                try:
                                    raw = os.read(master_fd, 4096)
                                    if not raw:
                                        break
                                    text = raw.decode("utf-8", errors="replace")
                                    asyncio.run_coroutine_threadsafe(
                                        websocket.send_json({"type": "data", "id": sid, "data": text}),
                                        loop
                                    )
                                except Exception:
                                    break

                        asyncio.run_coroutine_threadsafe(
                            websocket.send_json({"type": "exit", "id": sid}),
                            loop
                        )

                    t = threading.Thread(target=read_loop, args=(pty_obj, session_id, pty_type), daemon=True)
                    t.start()

                except Exception as e:
                    logger.error(f"Failed to spawn terminal: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})

            elif action == "write":
                data = msg.get("data", "")
                if pty_obj:
                    if pty_type == "winpty":
                        pty_obj.write(data)
                    else:
                        master_fd, _ = pty_obj
                        os.write(master_fd, data.encode("utf-8"))

            elif action == "resize":
                cols = msg.get("cols", 80)
                rows = msg.get("rows", 24)
                if pty_obj and pty_type == "winpty":
                    try:
                        pty_obj.set_size(cols, rows)
                    except Exception:
                        pass

            elif action == "kill":
                stop_event.set()
                if pty_obj and pty_type == "winpty":
                    del pty_obj
                active_ptys.pop(session_id, None)
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Terminal WebSocket error: {e}")
    finally:
        stop_event.set()
        active_ptys.pop(session_id, None)
