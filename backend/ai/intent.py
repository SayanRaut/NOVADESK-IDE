import re
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class IntentResult:
    intent: str
    confidence: float

class IntentClassifier:
    """
    Classifies the user intent from their request.
    Supported Intents: Coding, Planning, Review, Debug, Vision, Git, Search, Documentation, Chat, Testing
    """
    
    INTENTS = [
        "coding", "planning", "review", "debug", 
        "vision", "git", "search", "documentation", 
        "chat", "testing"
    ]
    
    # Simple keyword heuristics for fast classification
    KEYWORDS = {
        "coding": [r"\bcode\b", r"\bwrite\b", r"\bimplement\b", r"\bcreate\b", r"\bfunction\b", r"\bclass\b", r"\brefactor\b"],
        "planning": [r"\bplan\b", r"\barchitecture\b", r"\bdesign\b", r"\bstructure\b", r"\bmilestones\b"],
        "review": [r"\breview\b", r"\bcheck\b", r"\banalyze\b", r"\bsecurity\b", r"\bbest practices\b"],
        "debug": [r"\bdebug\b", r"\bfix\b", r"\berror\b", r"\bissue\b", r"\bbug\b", r"\bstack trace\b"],
        "vision": [r"\bimage\b", r"\bscreenshot\b", r"\bui\b", r"\bwireframe\b", r"\blook at\b"],
        "git": [r"\bgit\b", r"\bcommit\b", r"\bpush\b", r"\bpull\b", r"\bbranch\b", r"\bmerge\b"],
        "search": [r"\bsearch\b", r"\bfind\b", r"\blocate\b", r"\bwhere\b"],
        "documentation": [r"\bdoc\b", r"\bdocumentation\b", r"\breadme\b", r"\bexplain\b"],
        "testing": [r"\btest\b", r"\bunit test\b", r"\bintegration\b", r"\bpytest\b", r"\bjest\b"],
    }

    def classify(self, request: str, has_images: bool = False) -> IntentResult:
        """
        Classifies the request and returns the intent and confidence score.
        If images are attached, it strongly biases towards 'vision'.
        """
        if has_images:
            return IntentResult(intent="vision", confidence=0.95)
            
        request_lower = request.lower()
        
        scores = {intent: 0.0 for intent in self.INTENTS}
        
        # Base scoring via regex keywords
        for intent, patterns in self.KEYWORDS.items():
            for pattern in patterns:
                matches = len(re.findall(pattern, request_lower))
                scores[intent] += (matches * 0.2)
                
        # Default to chat if no strong signals
        best_intent = "chat"
        best_score = 0.1
        
        for intent, score in scores.items():
            if score > best_score:
                best_score = score
                best_intent = intent
                
        # Cap confidence at 0.99
        final_confidence = min(best_score, 0.99)
        
        return IntentResult(intent=best_intent, confidence=final_confidence)

intent_classifier = IntentClassifier()
