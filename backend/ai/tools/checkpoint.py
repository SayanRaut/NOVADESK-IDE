"""
Checkpoint System for NovaDesk IDE.
Follows Master Plan Section 18.
Provides safe snapshot creation, file backups, and rollback capabilities.
"""

import os
import uuid
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from ai.core.logger import logger

class Checkpoint:
    def __init__(
        self,
        checkpoint_id: str,
        task_id: str,
        files_backup: Dict[str, Optional[str]], # file_path -> previous content (or None if file was newly created)
        timestamp: Optional[str] = None,
        patch_info: Optional[str] = None
    ):
        self.id = checkpoint_id
        self.task_id = task_id
        self.files_backup = files_backup
        self.timestamp = timestamp or datetime.utcnow().isoformat()
        self.patch_info = patch_info
        self.status = "created"  # created, kept, rolled_back

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "timestamp": self.timestamp,
            "files_changed": list(self.files_backup.keys()),
            "status": self.status,
            "patch_info": self.patch_info
        }

class CheckpointManager:
    """
    Manages checkpoints across file modifications.
    Enables automatic rollback on failure or user request.
    """
    def __init__(self):
        self._checkpoints: Dict[str, Checkpoint] = {}

    def create_checkpoint(self, task_id: str, file_paths: List[str], patch_info: Optional[str] = None) -> Checkpoint:
        """
        Snapshots the specified files before modification.
        """
        checkpoint_id = f"cp-{uuid.uuid4().hex[:8]}"
        backups: Dict[str, Optional[str]] = {}

        for path in file_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path) and os.path.isfile(abs_path):
                try:
                    with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                        backups[abs_path] = f.read()
                except Exception as e:
                    logger.warning(f"Failed to read file {abs_path} for checkpoint: {e}")
                    backups[abs_path] = None
            else:
                # File did not exist previously
                backups[abs_path] = None

        cp = Checkpoint(
            checkpoint_id=checkpoint_id,
            task_id=task_id,
            files_backup=backups,
            patch_info=patch_info
        )
        self._checkpoints[checkpoint_id] = cp
        logger.info(f"Created checkpoint {checkpoint_id} for task {task_id} covering {len(backups)} files.")
        return cp

    def rollback(self, checkpoint_id: str) -> tuple[bool, str]:
        """
        Rolls back all files modified under this checkpoint to their original state.
        """
        if checkpoint_id not in self._checkpoints:
            return False, f"Checkpoint {checkpoint_id} not found."

        cp = self._checkpoints[checkpoint_id]
        restored = []
        errors = []

        for abs_path, original_content in cp.files_backup.items():
            try:
                if original_content is None:
                    # File was newly created, so remove it on rollback
                    if os.path.exists(abs_path):
                        os.remove(abs_path)
                        restored.append(f"Deleted new file: {abs_path}")
                else:
                    # Restore original content
                    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
                    with open(abs_path, "w", encoding="utf-8") as f:
                        f.write(original_content)
                    restored.append(f"Restored: {abs_path}")
            except Exception as e:
                err_msg = f"Failed to rollback {abs_path}: {e}"
                logger.error(err_msg)
                errors.append(err_msg)

        if errors:
            cp.status = "rollback_partial_error"
            return False, "\n".join(errors)

        cp.status = "rolled_back"
        logger.info(f"Successfully rolled back checkpoint {checkpoint_id}.")
        return True, f"Successfully rolled back {len(restored)} files."

    def keep(self, checkpoint_id: str):
        """Marks checkpoint changes as kept/verified."""
        if checkpoint_id in self._checkpoints:
            self._checkpoints[checkpoint_id].status = "kept"

    def get_checkpoint(self, checkpoint_id: str) -> Optional[Checkpoint]:
        return self._checkpoints.get(checkpoint_id)

    def list_checkpoints(self) -> List[Dict[str, Any]]:
        return [cp.to_dict() for cp in self._checkpoints.values()]

checkpoint_manager = CheckpointManager()
