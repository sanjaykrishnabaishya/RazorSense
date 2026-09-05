import os
import json
import random
from typing import Dict, Any
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv("../.env")

# Use GLM-5.2 for highly capable, fast, single-brain reasoning
unified_llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="google/gemma-4-31b-it:free"
)

def run_single_brain(user_id: str, message: str, history: list = None) -> Dict[str, Any]:
    if history is None:
        history = []
        
    history_str = json.dumps(history).replace("{", "{{").replace("}", "}}")
    
    system_prompt = f"""You are Krish, a dynamic customer support AI for RazorSense.
You are chatting with a user who has an issue with an online purchase (e.g. Amazon, Flipkart, Swiggy, PhonePe).

Chat History: {history_str}

YOUR TASK:
1. Converse naturally with the user to understand their issue.
2. Ask questions ONE AT A TIME to gather context if it is missing. Do NOT use rigid checklists, adapt to the user's situation. For example, a failed payment might not have an order ID yet.
3. If you have enough information to resolve the issue (e.g. they provided the issue, the merchant, and what they want done), you should officially resolve the issue and create a ticket.

CRITICAL INSTRUCTION:
You MUST output ONLY a raw JSON object exactly matching this schema. NO markdown backticks. Just the raw braces.
{{{{
    "reply": "string, your conversational message to the user.",
    "ticket_status": "none" | "investigating" | "resolved",
    "ticket_id": "string, generate a random RZ-XXXXX if status is not none",
    "merchant": "string, the merchant name if known, otherwise Unknown"
}}}}

If you need more info, set ticket_status to "none".
If you have enough info to resolve it, set ticket_status to "investigating" or "resolved" and tell the user in the reply that you have created a ticket and are processing their request.
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", "{message}")
    ])
    
    chain = prompt | unified_llm
    
    try:
        raw_res = chain.invoke({"message": message})
        content = raw_res.content.strip()
        print(f"[Single Brain Raw] {content}")
        
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        parsed = json.loads(content.strip())
        
        if parsed.get("ticket_status") in ["investigating", "resolved"] and not parsed.get("ticket_id"):
            parsed["ticket_id"] = f"RZ-{random.randint(10000, 99999)}"
            
        return parsed
        
    except Exception as e:
        print(f"[Single Brain Error] {e}")
        return {
            "reply": "I am sorry, I am having trouble connecting right now. Let me know what you need and I will process it shortly.",
            "ticket_status": "none",
            "ticket_id": "",
            "merchant": ""
        }
