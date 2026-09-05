from fastapi import FastAPI, HTTPException
import sqlite3
import os
from typing import Optional

app = FastAPI()

def get_db():
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/v2/orders/{order_id}")
def get_order(order_id: str):
    conn = get_db()
    order = conn.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
    conn.close()
    if order:
        return dict(order)
    raise HTTPException(status_code=404, detail="Order not found")

@app.get("/api/v2/orders")
def search_orders(merchant: Optional[str] = None, payment_mode: Optional[str] = None, order_date: Optional[str] = None):
    conn = get_db()
    query = "SELECT * FROM orders WHERE 1=1"
    params = []
    if merchant:
        query += " AND LOWER(merchant) LIKE ?"
        params.append(f"%{merchant.lower()}%")
    if payment_mode:
        query += " AND LOWER(payment_mode) LIKE ?"
        params.append(f"%{payment_mode.lower()}%")
    if order_date:
        query += " AND order_date = ?"
        params.append(order_date)
    else:
        query += " ORDER BY order_date DESC LIMIT 10"
        
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/v2/tickets")
def get_tickets(order_id: Optional[str] = None, ticket_id: Optional[str] = None):
    conn = get_db()
    if ticket_id:
        row = conn.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
        conn.close()
        if row:
            return dict(row)
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if order_id:
        rows = conn.execute("SELECT * FROM tickets WHERE order_id = ?", (order_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM tickets ORDER BY date DESC LIMIT 5").fetchall()
    conn.close()
    return [dict(row) for row in rows]

from pydantic import BaseModel
class TicketCreate(BaseModel):
    ticket_id: str
    order_id: Optional[str] = "N/A"
    merchant: Optional[str] = "N/A"
    issue: str
    date: str
    status: str
    action_taken: str
    product: Optional[str] = "N/A"

@app.post("/api/v2/tickets")
def create_ticket(ticket: TicketCreate):
    conn = get_db()
    
    # Check if column 'product' exists, if not add it
    cursor = conn.execute("PRAGMA table_info(tickets)")
    columns = [col[1] for col in cursor.fetchall()]
    if "product" not in columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN product TEXT DEFAULT 'N/A'")
        
    conn.execute(
        "INSERT INTO tickets (ticket_id, order_id, merchant, issue, date, status, action_taken, product) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (ticket.ticket_id, ticket.order_id, ticket.merchant, ticket.issue, ticket.date, ticket.status, ticket.action_taken, ticket.product)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "ticket_id": ticket.ticket_id}
