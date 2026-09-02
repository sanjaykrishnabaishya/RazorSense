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

from app.mocks import check_logistics_weight, check_payment_network, analyze_vision_evidence

@app.get("/api/telemetry/logistics/{order_id}")
def get_logistics_telemetry(order_id: int):
    return check_logistics_weight(order_id)

@app.get("/api/telemetry/payment/{customer_id}")
def get_payment_telemetry(customer_id: str):
    return check_payment_network(customer_id)

@app.get("/api/telemetry/vision")
def get_vision_telemetry(image_url: str):
    return analyze_vision_evidence(image_url)
from app.risk_engine import calculate_fraud_risk

class ResolveRequest(BaseModel):
    order_id: int
    customer_id: str
    image_url: str = None

@app.post("/api/resolve")
def resolve_dispute(req: ResolveRequest):
    result = calculate_fraud_risk(req.order_id, req.customer_id, req.image_url)
    
    # Here we would normally save the result to the SQLite DB
    # using db = SessionLocal() and db.add(Dispute(...))
    
    return {
        "status": "resolved",
        "risk_score": result["risk_score"],
        "final_decision": result["resolution"],
        "reasoning": result["flags"]
    }
