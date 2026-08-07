import time
from typing import Dict, Any

class MetricsCollector:
    """Collects metrics for AI requests."""
    
    def __init__(self):
        self._metrics = []
        
    def record_request(self, model: str, duration_ms: float, tokens_in: int, tokens_out: int, success: bool):
        self._metrics.append({
            "timestamp": time.time(),
            "model": model,
            "duration_ms": duration_ms,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "success": success
        })
        
    def get_summary(self) -> Dict[str, Any]:
        if not self._metrics:
            return {"total_requests": 0}
            
        success_count = sum(1 for m in self._metrics if m["success"])
        total_duration = sum(m["duration_ms"] for m in self._metrics)
        
        return {
            "total_requests": len(self._metrics),
            "success_rate": success_count / len(self._metrics),
            "average_duration_ms": total_duration / len(self._metrics)
        }

metrics_collector = MetricsCollector()
