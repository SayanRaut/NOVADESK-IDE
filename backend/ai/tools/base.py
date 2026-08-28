"""
Base Tool definition for NovaDesk IDE.
Follows Master Plan Section 16 & 17.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional
import asyncio
from ai.core.logger import logger
from ai.core.state import RiskLevel, ToolCategory

class ToolError(Exception):
    pass

class ToolPermissionDenied(Exception):
    pass

class BaseTool(ABC):
    """Base class for all tools with risk levels, input validation, and audit logging."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
        
    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @property
    def category(self) -> ToolCategory:
        return ToolCategory.READ

    @property
    def risk_level(self) -> RiskLevel:
        return RiskLevel.LOW

    @property
    def timeout_seconds(self) -> float:
        return 30.0

    @abstractmethod
    def validate(self, **kwargs) -> bool:
        """Validates input parameters against tool specification."""
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """Executes tool logic."""
        pass

    async def run(self, **kwargs) -> Tuple[bool, Any]:
        """Validates, times, logs audit event, and safely executes the tool."""
        try:
            logger.info(f"Executing tool '{self.name}' [{self.risk_level.value}] with args: {list(kwargs.keys())}")
            if not self.validate(**kwargs):
                raise ToolError(f"Validation failed for tool '{self.name}' with provided arguments.")
            
            # Execute with timeout
            result = await asyncio.wait_for(self.execute(**kwargs), timeout=self.timeout_seconds)
            logger.info(f"Tool '{self.name}' executed successfully.")
            return True, result
        except asyncio.TimeoutError:
            err = f"Tool '{self.name}' timed out after {self.timeout_seconds} seconds."
            logger.error(err)
            return False, err
        except Exception as e:
            logger.error(f"Tool '{self.name}' execution failed: {str(e)}")
            return False, str(e)
