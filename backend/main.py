from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import re

app = FastAPI(title="RazorSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    stage: str

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    time.sleep(1) # Simulate network/processing
    
    msg = req.message.lower()
    
    if req.stage == 'find-purchase':
        if any(w in msg for w in ['hi', 'hello', 'hey']):
            return {"reply": "Hi there! I'm Razor, your AI support assistant. Please share an order ID, merchant name, or email so I can find your purchase."}
        
        # Simulate finding an order
        return {
            "reply": "I've located a few transactions that might match. I'm bringing them up now.",
            "action": "trigger_search",
            "search_query": req.message
        }
        
    if req.stage == 'verify-details':
        if 'yes' in msg or 'correct' in msg or 'that is the one' in msg:
            return {
                "reply": "Great! Let's verify the details cryptographically with the merchant to ensure everything is in order.",
                "action": "trigger_verify"
            }
        
    if req.stage == 'analyse-issue':
        if 'broken' in msg or 'damaged' in msg or 'tear' in msg:
            return {
                "reply": "I understand the item arrived damaged. Please upload a photo or video so my Vision AI can run a diagnostic on the wear & tear.",
                "action": "request_upload"
            }
        if 'refund' in msg or 'return' in msg:
            return {
                "reply": "I can help you process a refund. Which of the resolution options works best for you?",
                "action": "show_resolution"
            }
            
    return {"reply": "I understand. I am processing your request through the RazorSense neural engine to find the best resolution."}

@app.get("/api/health")
async def health():
    return {"status": "ok"}
