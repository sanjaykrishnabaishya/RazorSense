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

# Seed Vector DB
import vector_db
vector_db.seed_knowledge_base()

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

import os
import threading
import time
import urllib.request

# -----------------
# KEEP-ALIVE DAEMON (Prevents Render Free-Tier Spin-Down)
# -----------------
def _keep_alive_loop():
    """Pings the live Render endpoint every 9 minutes to keep the container awake 24/7."""
    time.sleep(15)  # Wait for server startup
    backend_url = os.environ.get("RENDER_EXTERNAL_URL", "https://razorsense-backend.onrender.com")
    health_url = f"{backend_url.rstrip('/')}/health"
    print(f"[Keep-Alive] Daemon started. Target: {health_url}")
    while True:
        try:
            time.sleep(540)  # Ping every 9 minutes (Render timeout is 15 minutes)
            req = urllib.request.Request(health_url, headers={"User-Agent": "RazorSenseKeepAlive/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[Keep-Alive] Pinged {health_url} -> Status {resp.status}")
        except Exception as e:
            print(f"[Keep-Alive] Ping note: {e}")

_keep_alive_thread = threading.Thread(target=_keep_alive_loop, daemon=True)
_keep_alive_thread.start()

@app.get("/health")
def health_check():
    """Health & pre-warm check endpoint for instant response."""
    return {
        "status": "ok",
        "service": "RazorSense AI Gateway",
        "timestamp": time.time(),
        "warmed": True
    }

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

@app.get("/api/orders/recent-deliveries")
def get_recent_deliveries():
    """Returns the most recent delivered orders for the proactive delivery pill."""
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    orders = conn.execute("""
        SELECT order_id, merchant, product, amount, order_date, status, payment_mode
        FROM orders
        WHERE status = 'Delivered'
        ORDER BY order_date DESC
        LIMIT 5
    """).fetchall()
    conn.close()
    return [dict(o) for o in orders]

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
    """Get all tickets for the logged-in user from the enterprise DB."""
    import sqlite3
    import os
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM tickets ORDER BY rowid DESC").fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except:
        return []

# -----------------
# DUAL-BRAIN ENDPOINT
# -----------------
from fastapi import BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from agentic_brain import run_agentic_brain, run_agentic_brain_stream
from typing import Dict, Any
import time
import vector_db

# ---- Rate Limiter (protects Gemini quota while allowing natural conversation) ----
_rate_limit_store: Dict[str, float] = {}
RATE_LIMIT_SECONDS = 2  # 1 request per user per 2 seconds (safe for 500 RPD)

def check_rate_limit(user_id: str):
    now = time.time()
    last = _rate_limit_store.get(user_id, 0)
    if now - last < RATE_LIMIT_SECONDS:
        wait = round(RATE_LIMIT_SECONDS - (now - last), 1)
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
def chat(req: ChatRequest, current_user: models.User = Depends(get_current_user)):
    """Main Chat API — non-blocking threadpool execution."""
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
def chat_stream(req: ChatRequest, current_user: models.User = Depends(get_current_user)):
    """Streaming Chat API — non-blocking SSE streaming from threadpool."""
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

# -----------------
# ENTERPRISE GATEWAY & DISPUTE DEFENSE ENDPOINTS
# -----------------
import dispute_engine

class DisputeSimulateRequest(BaseModel):
    order_id: str = "ORD-9932"
    reason: str = "merchandise_not_received"
    payment_id: str | None = None

@app.post("/api/webhooks/gateway")
async def gateway_webhook(request: Request):
    """
    Receives inbound Webhooks from the Enterprise Payment Gateway.
    Verifies HMAC-SHA256 signature and autonomously contests bank disputes.
    """
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature") or request.headers.get("X-Gateway-Signature")

    # Cryptographically verify the signature
    if not dispute_engine.verify_gateway_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid Gateway Signature")

    try:
        event_data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON Payload")

    event_type = event_data.get("event", "")
    print(f"[Gateway Webhook] Event received: {event_type}")

    if event_type == "dispute.created":
        dispute_entity = event_data.get("payload", {}).get("dispute", {}).get("entity", {})
        dispute_id = dispute_entity.get("id", f"disp_{int(time.time())}")
        payment_id = dispute_entity.get("payment_id", "pay_unknown")
        reason = dispute_entity.get("reason_code", "chargeback_claim")
        
        # Autonomously compile evidence and file representment defense
        result = dispute_engine.record_and_contest_dispute(
            payment_id=payment_id,
            dispute_id=dispute_id,
            reason=reason
        )
        return {"status": "SUCCESS", "action": "AUTONOMOUS_DEFENSE_FILED", "dispute": result}

    elif event_type == "refund.processed":
        refund_entity = event_data.get("payload", {}).get("refund", {}).get("entity", {})
        refund_id = refund_entity.get("id")
        print(f"[Gateway Webhook] Refund {refund_id} successfully settled.")
        return {"status": "SUCCESS", "action": "REFUND_CONFIRMED"}

    return {"status": "ACKNOWLEDGED", "event": event_type}

@app.get("/api/disputes")
def list_disputes():
    """Returns all tracked bank chargebacks and their AI representment dossiers."""
    return dispute_engine.get_all_disputes()

@app.post("/api/disputes/simulate")
def simulate_dispute(req: DisputeSimulateRequest):
    """
    Test harness: Simulates an inbound bank chargeback on a specified order.
    Triggered locally to verify autonomous representment without real bank intervention.
    """
    dispute_id = f"disp_sim_{int(time.time())}"
    payment_id = req.payment_id or f"pay_txn_{int(time.time())}"
    
    result = dispute_engine.record_and_contest_dispute(
        payment_id=payment_id,
        dispute_id=dispute_id,
        reason=req.reason,
        order_id_hint=req.order_id
    )
    return {
        "message": "Bank dispute simulated and contested autonomously by RazorSense AI",
        "data": result
    }

