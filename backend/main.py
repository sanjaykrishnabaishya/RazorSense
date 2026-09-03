from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from auth import get_current_user
from pydantic import BaseModel

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RazorSense Secure API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# SCHEMAS
# -----------------
class LoginRequest(BaseModel):
    phone_number: str

class TicketCreate(BaseModel):
    order_number: str
    request_details: str

# -----------------
# ROUTES
# -----------------

@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Mock OTP Login. In prod, this verifies an OTP and returns a JWT."""
    user = db.query(models.User).filter(models.User.phone_number == req.phone_number).first()
    if not user:
        # Auto-create user for demo purposes
        user = models.User(phone_number=req.phone_number, full_name="Test User")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Return the phone number as a mock "JWT token"
    return {"access_token": user.phone_number, "token_type": "bearer"}


@app.get("/api/orders/{order_number}")
def get_order_details(order_number: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Securely fetches order details. 
    ENFORCES AUTHORIZATION: Only the owner can see their order.
    """
    order = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.user_id != current_user.id:
        # Security Issue #5 and #6 solved: Do not leak other users' orders
        raise HTTPException(
            status_code=403, 
            detail="Sorry, I don't have information for this order id. Please contact our customer support +91 XXXXX XXXXX"
        )
        
    return {
        "order_number": order.order_number,
        "product_name": order.product_name,
        "price": order.price,
        "merchant": order.merchant.name,
        "transaction_mode": order.transaction_mode
    }


@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Creates a new support ticket securely."""
    import uuid
    
    # 1. Verify order belongs to user
    order = db.query(models.Order).filter(models.Order.order_number == ticket.order_number).first()
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to create ticket for this order")
        
    # 2. Create internal ticket
    new_ticket = models.SupportTicket(
        ticket_id=f"RZ-{str(uuid.uuid4())[:6].upper()}",
        user_id=current_user.id,
        order_number=order.order_number,
        merchant_name=order.merchant.name,
        request_details=ticket.request_details,
        action_taken="Ticket Logged. Pending AI Review.",
        status="In Review"
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return {"message": "Ticket created successfully", "ticket_id": new_ticket.ticket_id}


@app.get("/api/tickets")
def get_user_tickets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get all tickets for the logged-in user."""
    tickets = db.query(models.SupportTicket).filter(models.SupportTicket.user_id == current_user.id).all()
    return tickets

# -----------------
# LANGGRAPH ENDPOINT
# -----------------
from agent_graph import app as langgraph_app
from langchain_core.messages import HumanMessage
from typing import Dict, Any

class ChatRequest(BaseModel):
    message: str
    checklist: Dict[str, Any] = {}

@app.post("/api/chat")
def chat_with_agent(req: ChatRequest, current_user: models.User = Depends(get_current_user)):
    """Routes a message through the LangGraph AI Brain."""
    state = {
        "messages": [HumanMessage(content=req.message)],
        "user_id": current_user.id,
        "intent": "",
        "next_agent": "",
        "checklist": req.checklist
    }
    
    # Invoke the compiled graph
    result = langgraph_app.invoke(state)
    
    # The last message is the response from the sub-agent
    ai_reply = result["messages"][-1].content
    
    return {
        "reply": ai_reply,
        "checklist": result["checklist"],
        "agent": result.get("next_agent", "Unknown")
    }
