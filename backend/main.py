from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from auth import get_current_user
from pydantic import BaseModel

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

# Seed database with the exact orders the AI knows about (so the widget can find them!)
from seed import seed_db
seed_db()

app = FastAPI(title="RazorSense Secure API")

from enterprise_api import app as enterprise_app
app.mount("/enterprise", enterprise_app)

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


@app.get("/api/orders/search")
async def search_orders(q: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = q.lower()
    
    orders = db.query(models.Order).join(models.Merchant).filter(
        models.Order.user_id == current_user.id
    ).filter(
        (models.Order.order_number.ilike(f"%{query}%")) |
        (models.Order.product_name.ilike(f"%{query}%")) |
        (models.Merchant.name.ilike(f"%{query}%"))
    ).all()
    
    results = []
    for order in orders:
        results.append({
            "id": str(order.id),
            "merchant": order.merchant.name,
            "date": order.created_at.strftime("%d %b %Y"),
            "amount": float(order.price),
            "currency": "INR",
            "item": order.product_name,
            "status": "delivered",
            "orderId": order.order_number
        })
        
    return results
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
        "order_id": order.order_number,
        "product": order.product_name,
        "price": order.price,
        "merchant": order.merchant.name,
        "payment_mode": order.transaction_mode,
        "order_date": order.order_date,
        "status": order.status
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
# DUAL-BRAIN ENDPOINT
# -----------------
from fastapi import BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from agentic_brain import run_agentic_brain, run_agentic_brain_stream
from typing import Dict, Any
import time
import vector_db

# ---- Rate Limiter (protects free Gemini quota) ----
_rate_limit_store: Dict[str, float] = {}
RATE_LIMIT_SECONDS = 10  # 1 request per user per 10 seconds

def check_rate_limit(user_id: str):
    now = time.time()
    last = _rate_limit_store.get(user_id, 0)
    if now - last < RATE_LIMIT_SECONDS:
        wait = round(RATE_LIMIT_SECONDS - (now - last))
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {wait} seconds before sending another message."
        )
    _rate_limit_store[user_id] = now

class ChatRequest(BaseModel):
    message: str
    checklist: Dict[str, Any] = {}
    media: str | None = None
    history: list = []

@app.post("/api/chat")
async def chat(req: ChatRequest, current_user: models.User = Depends(get_current_user)):
    """Main Chat API — non-streaming fallback."""
    check_rate_limit(str(current_user.id))
    try:
        response = run_agentic_brain(
            user_id=str(current_user.id),
            message=req.message,
            history=req.history,
            media=req.media
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, current_user: models.User = Depends(get_current_user)):
    """Streaming Chat API — streams tokens as they arrive from Gemini (low latency)."""
    check_rate_limit(str(current_user.id))

    def generate():
        try:
            for chunk in run_agentic_brain_stream(
                user_id=str(current_user.id),
                message=req.message,
                history=req.history,
                media=req.media
            ):
                # SSE format: data: <chunk>\n\n
                # CRITICAL FIX: Escape newlines so SSE frontend doesn't drop lines that don't start with 'data:'
                clean_chunk = chunk.replace('\n', '\\n')
                yield f"data: {clean_chunk}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
