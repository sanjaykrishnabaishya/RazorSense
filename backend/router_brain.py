import json
import re
from typing import Dict, Any

# ==========================================
# BRUTALLY HONEST ARCHITECTURE (HYBRID ROUTER)
# ==========================================
# In a real production app, the LLM should NOT run the conversation.
# Python should run the conversation. The LLM is only used as a "parser" 
# to translate messy human text into clean JSON.

def identify_issue_type(message: str) -> str:
    """
    Lightning fast, 0ms latency semantic routing using Python.
    In production, use a fast embedding model or zero-shot classifier here.
    """
    msg = message.lower()
    
    if any(word in msg for word in ["pay", "payment", "phonepe", "gpay", "deducted", "stuck", "charged"]):
        return "payment_issue"
        
    if any(word in msg for word in ["wrong", "damaged", "broken", "missing", "fake", "quality"]):
        return "product_defect"
        
    if any(word in msg for word in ["driver", "delivery", "late", "behavior", "rude"]):
        return "delivery_issue"
        
    return "unknown"

def handle_payment_issue(message: str, history: list) -> Dict[str, Any]:
    """Specific Python logic for handling payment issues. Every issue is different!"""
    # 1. Check what we already know from history
    known_info = " ".join([h.get("text", "") for h in history]).lower() + " " + message.lower()
    
    has_merchant = any(m in known_info for m in ["phonepe", "amazon", "flipkart", "zomato", "swiggy", "myntra"])
    has_time = any(t in known_info for t in ["hour", "minute", "day", "yesterday", "since"])
    
    if not has_merchant:
        return {
            "reply": "I see you're having a payment issue. Which app or merchant were you trying to pay?",
            "ticket_status": "none"
        }
        
    if not has_time:
        return {
            "reply": "Got it. How long ago did this transaction get stuck?",
            "ticket_status": "none"
        }
        
    import random
    # If we have the info, Python forcefully resolves it. No LLM hallucination possible.
    return {
        "reply": "I understand your payment has been stuck. I've escalated this to our financial resolutions team to track the UTR number. They will refund the amount within 24 hours if it failed.",
        "ticket_status": "investigating",
        "ticket_id": f"RZ-{random.randint(10000, 99999)}",
        "merchant": "Detected from Chat"
    }


def handle_product_defect(message: str, history: list) -> Dict[str, Any]:
    """Specific Python logic for defective products."""
    known_info = " ".join([h.get("text", "") for h in history]).lower() + " " + message.lower()
    
    if "order" not in known_info and not re.search(r'\d{4,}', known_info):
        return {
            "reply": "I'm so sorry you received a defective item! Could you please provide the Order ID so I can look up the seller?",
            "ticket_status": "none"
        }
        
    if "refund" not in known_info and "replace" not in known_info:
        return {
            "reply": "Would you prefer a full refund for this, or a replacement item?",
            "ticket_status": "none"
        }
        
    import random
    return {
        "reply": "I have processed your request for this defective item. A pickup will be scheduled shortly.",
        "ticket_status": "resolved",
        "ticket_id": f"RZ-{random.randint(10000, 99999)}",
        "merchant": "Detected from Chat"
    }

def run_hybrid_brain(user_id: str, message: str, history: list = None) -> Dict[str, Any]:
    """
    The master Python controller. 
    It routes the issue instantly (0ms latency), completely bypassing the LLM if possible!
    """
    if history is None:
        history = []
        
    # Step 1: Python figures out what the user is talking about
    issue_category = identify_issue_type(message)
    
    # If Python isn't sure, it looks at the history to remember the context
    if issue_category == "unknown" and history:
        full_context = " ".join([h.get("text", "") for h in history])
        issue_category = identify_issue_type(full_context)
        
    # Step 2: Python routes to the SPECIFIC handler for that issue.
    # Every issue is different! They do not follow the same prompt/checklist!
    if issue_category == "payment_issue":
        return handle_payment_issue(message, history)
        
    elif issue_category == "product_defect":
        return handle_product_defect(message, history)
        
    elif issue_category == "delivery_issue":
        # Example hardcoded response
        return {
            "reply": "I apologize for the delivery experience. Could you share your order ID so I can report the delivery partner?",
            "ticket_status": "none"
        }
        
    else:
        # FALLBACK: If Python has no idea, ONLY THEN do we call the heavy LLM!
        # (For this example, we'll just return a fallback text)
        return {
            "reply": "Could you tell me a little bit more about the issue you are facing?",
            "ticket_status": "none"
        }
