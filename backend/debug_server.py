import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.intent import intent_classifier
from ai.router import model_router
from ai.core.logger import logger
import uvicorn

# 1. Save original methods
original_classify = intent_classifier.classify
original_route = model_router.route

# 2. Define our wrappers with debug logging
def debug_classify(request: str, has_images: bool = False):
    result = original_classify(request, has_images)
    logger.info("=====================================")
    logger.info("🧠 [INTENT SELECTOR - DEBUG RUNTIME]")
    logger.info(f"   Request Snippet : {request[:50]}...")
    logger.info(f"   Has Images      : {has_images}")
    logger.info(f"   Chosen Intent   : {result.intent.upper()}")
    logger.info(f"   Confidence      : {result.confidence:.2f}")
    logger.info("=====================================")
    return result

def debug_route(intent_result):
    model = original_route(intent_result)
    role = model_router.INTENT_TO_ROLE.get(intent_result.intent, "coding")
    logger.info("=====================================")
    logger.info("🚀 [MODEL ROUTER - DEBUG RUNTIME]")
    logger.info(f"   Target Role     : {role.upper()}")
    logger.info(f"   Routed Model    : {model.name}")
    logger.info(f"   Model ID        : {model.id}")
    logger.info(f"   Provider        : {model.provider}")
    logger.info("=====================================")
    return model

# 3. Apply the patches
intent_classifier.classify = debug_classify
model_router.route = debug_route

if __name__ == "__main__":
    print("\n" + "*"*60)
    print("* STARTING SERVER IN DEBUG MODE (Router/Intent Logging)    *")
    print("* Press Ctrl+C to stop.                                    *")
    print("*"*60 + "\n")
    
    # We must run with reload=False so it stays in this process
    # and keeps our monkey-patches active.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
