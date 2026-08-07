from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from ai.core.logger import logger

class ToolError(Exception):
    pass

class BaseTool(ABC):
    """Base class for all tools."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
        
    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    def validate(self, **kwargs) -> bool:
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        pass

    async def run(self, **kwargs) -> Tuple[bool, Any]:
        """Validates, logs, and safely executes the tool."""
        try:
            logger.info(f"Executing tool {self.name} with args: {kwargs}")
            if not self.validate(**kwargs):
                raise ToolError(f"Validation failed for tool {self.name} with args {kwargs}")
            
            result = await self.execute(**kwargs)
            logger.info(f"Tool {self.name} executed successfully.")
            return True, result
        except Exception as e:
            logger.error(f"Tool {self.name} execution failed: {str(e)}")
            return False, str(e)
