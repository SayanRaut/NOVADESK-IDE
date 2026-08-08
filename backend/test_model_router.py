import sys
import os

# Add the backend directory to sys.path so we can import 'ai'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.intent import intent_classifier
from ai.router import model_router

def test_request(request: str, has_images: bool = False):
    print(f"\n" + "="*40)
    print(f"Request: '{request}'")
    print(f"Has Images: {has_images}")
    
    # 1. Classify intent
    intent_result = intent_classifier.classify(request, has_images=has_images)
    print(f"\n[1] Intent Classification")
    print(f"    -> Intent: {intent_result.intent}")
    print(f"    -> Confidence: {intent_result.confidence:.2f}")
    
    # 2. Route to model
    model = model_router.route(intent_result)
    print(f"\n[2] Model Routing")
    print(f"    -> Model Name: {model.name}")
    print(f"    -> Model ID: {model.id}")
    print(f"    -> Provider: {model.provider}")
    print("="*40 + "\n")

if __name__ == "__main__":
    print("========================================")
    print("   Model Router & Selector Tester")
    print("========================================")
    print("Type a prompt/request to see which intent and model it routes to.")
    print("Type 'exit' or 'quit' to stop.\n")
    
    while True:
        try:
            req = input("Enter request (or 'exit'): ")
            if req.lower() in ['exit', 'quit']:
                break
            if not req.strip():
                continue
            
            has_img_str = input("Has images attached? (y/n): ")
            has_images = has_img_str.strip().lower().startswith('y')
            
            test_request(req, has_images=has_images)
            
        except KeyboardInterrupt:
            print("\nExiting...")
            break
