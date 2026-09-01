from fastapi import FastAPI
from app.database import engine, Base
import app.models
from app.rag import ingest_edge_cases
import os

# Create database tables
Base.metadata.create_all(bind=engine)

# Ingest edge cases into ChromaDB if taxonomy exists
if os.path.exists("taxonomy.json"):
    ingest_edge_cases("taxonomy.json")

app = FastAPI(
    title="RazorSense API",
    description="Autonomous post-purchase dispute resolution engine.",
    version="0.1.0"
)

from pydantic import BaseModel
from app.agent import razorsense_agent

class ChatRequest(BaseModel):
    order_id: int
    message: str
    chat_history: list = [] # List of dicts: {"role": "user"/"ai", "content": "..."}

@app.post("/api/chat")
def chat_with_agent(req: ChatRequest):
    # Prepare state
    messages = req.chat_history + [{"role": "user", "content": req.message}]
    initial_state = {
        "messages": messages,
        "dispute_context": "",
        "clarification_needed": False,
        "final_decision": ""
    }
    
    # Run the graph
    result = razorsense_agent.invoke(initial_state)
    
    # Check if we need to ask the user a question or if a decision was made
    if result["clarification_needed"]:
        latest_ai_message = result["messages"][-1]["content"]
        return {"status": "clarifying", "reply": latest_ai_message, "chat_history": result["messages"]}
    else:
        decision = result.get("final_decision", "HUMAN_INTERVENTION")
        return {"status": "decided", "decision": decision, "chat_history": result["messages"]}

