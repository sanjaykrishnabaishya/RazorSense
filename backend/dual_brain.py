import os
import json
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, Any

load_dotenv("../.env")

# Dual-Brain Architecture Setup

fast_llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="liquid/lfm-2.5-2.6b:free"
)

heavy_llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="meta-llama/llama-3.1-8b-instruct:free"
)

vision_llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="meta-llama/llama-3.2-11b-vision-instruct:free"
)

# In-memory store for background research (In production: Redis or Postgres)
RESEARCH_CACHE: Dict[int, str] = {}

class FastBrainOutput(BaseModel):
    reply: str = Field(description="The dynamic, polite response to the user.")
    extracted_checklist: dict = Field(description="Key-value pairs of extracted order details from the user's message.")

def run_heavy_brain_background(user_id: int, issue: str, demand: str, product: str, media: str = None):
    """
    Runs in the background. Analyzes media via VisionBrain, then researches policies via HeavyBrain.
    """
    print(f"[Heavy Brain] Waking up to research issue: {issue}...")
    
    evidence_desc = "No visual evidence provided."
    if media:
        print("[Vision Brain] Analyzing uploaded media...")
        try:
            vis_msg = [
                {"role": "user", "content": [
                    {"type": "text", "text": f"The user is claiming the following issue: '{issue}'. Analyze this image as evidence for their claim. Describe exactly what you see objectively, and state whether it supports or contradicts their issue."},
                    {"type": "image_url", "image_url": {"url": media}}
                ]}
            ]
            vis_res = vision_llm.invoke(vis_msg)
            evidence_desc = vis_res.content
            print(f"[Vision Brain] Analysis: {evidence_desc}")
        except Exception as e:
            print(f"[Vision Brain] Failed: {e}")
            evidence_desc = "Visual evidence provided but could not be processed."
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the RazorSense Heavy Resolution Brain. "
                   "Analyze the following customer issue and formulate a strict policy resolution plan. "
                   "Keep it concise. If it sounds like fraud or the visual evidence contradicts the claim, explicitly flag it for Human Escalation. "
                   "Otherwise, outline the standard refund/replacement steps."),
        ("user", f"Product: {product}\nIssue: {issue}\nDemand: {demand}\nVisual Evidence Analysis: {evidence_desc}")
    ])
    
    chain = prompt | heavy_llm
    try:
        res = chain.invoke({})
        plan = res.content
        print(f"[Heavy Brain] Research Complete! Cached plan for user {user_id}")
        RESEARCH_CACHE[user_id] = plan
    except Exception as e:
        print(f"[Heavy Brain] Failed: {e}")
        RESEARCH_CACHE[user_id] = "I apologize, but my heavy resolution server is temporarily overloaded right now. Please tell the user to try again in a few minutes."


def get_dynamic_checklist(issue: str) -> list:
    """Returns a dynamic list of required fields based on the specific issue."""
    if not issue:
        return ["issue"] # Can't know what we need until we know the issue
        
    issue_lower = issue.lower()
    base_fields = ["order_id", "issue", "demand"]
    
    # Delivery Driver / Behavior complaints
    if any(keyword in issue_lower for keyword in ["driver", "behavior", "rude", "late", "misbehave", "delivery guy"]):
        return base_fields + ["delivery_date", "driver_description"]
        
    # Physical Product Defects / Fraud
    if any(keyword in issue_lower for keyword in ["damage", "broken", "wrong item", "missing", "fake", "soap", "brick", "quality"]):
        return base_fields + ["merchant_name", "product_details", "media_evidence"]
        
    # Financial / Refund issues
    if any(keyword in issue_lower for keyword in ["refund", "payment", "charged twice", "money"]):
        return base_fields + ["payment_mode"]
        
    # Default fallback for unknown issues
    return base_fields + ["product_details"]

def run_fast_brain(user_id: int, message: str, current_checklist: dict, media: str = None, history: list = None) -> Dict[str, Any]:
    """
    Runs instantly on the UI thread.
    """
    if history is None:
        history = []
    
    print(f"[Fast Brain] Processing message...")
    
    # Check if Heavy Brain has finished its background research for this user
    pre_computed_plan = RESEARCH_CACHE.get(user_id, "")
    
    msg_clean = message.strip().lower()
    
    # 0ms Latency Bypass for polling
    if msg_clean == "[poll]":
        if pre_computed_plan and pre_computed_plan != "Research not complete yet.":
            # The background research is done! Let the Fast Brain format the final answer.
            pass
        else:
            return {
                "reply": "I'm looking into this for you...",
                "checklist": current_checklist,
                "needs_research": False
            }

    # 0ms Latency Bypass for basic greetings
    if msg_clean in ['hi', 'hello', 'hey', 'start', 'help'] and not current_checklist and not media:
        return {
            "reply": "Hi there! I'm Krish, your support assistant. What seems to be the issue today?",
            "checklist": {},
            "needs_research": False
        }

    # If the user sends a real message, clear any stale research ONLY if it's completely irrelevant
    if msg_clean != "[poll]":
        pass
        
    if media:
        current_checklist["media_evidence"] = "Provided"
    
    # Check if Heavy Brain has finished its background research for this user
    pre_computed_plan = RESEARCH_CACHE.get(user_id, "Research not complete yet.")
    
    current_issue = current_checklist.get("issue", "")
    required_fields = get_dynamic_checklist(current_issue)
    missing_fields = [field for field in required_fields if not current_checklist.get(field)]
    
    checklist_str = json.dumps(current_checklist).replace("{", "{{").replace("}", "}}")
    missing_str = str(missing_fields).replace("{", "{{").replace("}", "}}")
    plan_str = pre_computed_plan.replace("{", "{{").replace("}", "}}")
    history_str = json.dumps(history).replace("{", "{{").replace("}", "}}")
    
    possible_fields = ["order_id", "issue", "demand", "delivery_date", "driver_description", "merchant_name", "product_details", "media_evidence", "payment_mode"]
    required_str = str(possible_fields)
    
    next_missing = missing_fields[0] if missing_fields else ''
    
    system_prompt = f"""You are Krish, a dynamic customer support AI.
    Chat History: {history_str}
    Current Checklist: {checklist_str}
    Missing Fields: {missing_str}
    Pre-computed Policy Plan: {plan_str}
    
    INSTRUCTIONS:
    1. Extract any newly provided checklist items from the user's message. Valid fields you can extract are: {required_str}.
    2. IF Missing Fields is NOT empty: Your 'reply' MUST be a friendly question asking the user ONLY for this specific field: '{next_missing}'. DO NOT ask for fields we already have!
    3. IF Missing Fields is empty: You must resolve the ticket using ONLY the 'Pre-computed Policy Plan' to tell the user their final resolution.
    
    CRITICAL: You must return ONLY raw JSON matching this schema exactly, with NO markdown formatting, NO backticks, and NO other text. For extracted_checklist, only include fields from {required_str} that you found:
    {{{{
      "reply": "string, the friendly 1-2 sentence response",
      "extracted_checklist": {{{{
        "order_id": "extracted value (if found)",
        "issue": "extracted value (if found)",
        "demand": "extracted value (if found)",
        "merchant_name": "extracted value (if found)",
        "product_details": "extracted value (if found)"
      }}}}
    }}}}
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", "{message}")
    ])
    
    chain = prompt | fast_llm
    
    try:
        raw_res = chain.invoke({"message": message})
        content = raw_res.content.strip()
        print(f"[Fast Brain Raw] {content}")
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        parsed = json.loads(content.strip())
        
        # Merge new fields
        extracted = parsed.get("extracted_checklist", {})
        for k, v in extracted.items():
            if v and str(v).strip() and k in possible_fields:
                current_checklist[k] = v
                
        # Recalculate required fields now that we might have a new issue!
        current_issue = current_checklist.get("issue", "")
        required_fields = get_dynamic_checklist(current_issue)
                
        missing_fields = [field for field in required_fields if not current_checklist.get(field)]
        
        if not missing_fields and (not pre_computed_plan or pre_computed_plan == "Research not complete yet."):
            needs_research = (user_id not in RESEARCH_CACHE)
            if needs_research:
                RESEARCH_CACHE[user_id] = "Research not complete yet." # Mark as running so it doesn't double-trigger
                
            return {
                "reply": "I'm looking into this for you...",
                "checklist": current_checklist,
                "needs_research": needs_research,
                "issue": current_checklist.get("issue", ""),
                "demand": current_checklist.get("demand", ""),
                "product": current_checklist.get("product_details", "")
            }
            
        if not missing_fields and pre_computed_plan and pre_computed_plan != "Research not complete yet.":
            RESEARCH_CACHE.pop(user_id, None)
            
        # Check if we should trigger the Heavy Brain
        needs_research = False
        if not missing_fields and user_id not in RESEARCH_CACHE:
            needs_research = True
            if needs_research:
                RESEARCH_CACHE[user_id] = "Research not complete yet."
                
        # Programmatic safeguard for small model hallucinations
        final_reply = parsed.get("reply", "")
        if missing_fields:
            next_needed = missing_fields[0].replace('_', ' ')
            # If the LLM hallucinated and asked a question about something else, or didn't ask a question
            if "?" not in final_reply:
                final_reply += f" Could you please provide your {next_needed}?"
            
        return {
            "reply": final_reply,
            "checklist": current_checklist,
            "needs_research": needs_research,
            "issue": current_checklist.get("issue", ""),
            "demand": current_checklist.get("demand", ""),
            "product": current_checklist.get("product_details", "")
        }
    except Exception as e:
        print(f"[Fast Brain Error] {e}")
        return {
            "reply": "I'm sorry, my brain is having trouble connecting to the network right now. Please try again in a moment.",
            "checklist": current_checklist,
            "needs_research": False
        }
