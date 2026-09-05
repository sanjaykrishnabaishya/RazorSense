from fastapi import FastAPI, HTTPException
import sqlite3
import os
from typing import Optional

app = FastAPI()

def init_db():
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    # Create orders table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            merchant TEXT,
            product TEXT,
            amount REAL,
            order_date TEXT,
            status TEXT,
            payment_mode TEXT
        )
    """)
    # Create tickets table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            ticket_id TEXT PRIMARY KEY,
            order_id TEXT,
            merchant TEXT,
            issue TEXT,
            date TEXT,
            status TEXT,
            action_taken TEXT,
            product TEXT
        )
    """)
    
    # Auto-seed Demo Data for Portfolio Visitors!
    cursor = conn.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        print("Auto-seeding Demo Database for visitors...")
        demo_orders = [
            ("ORD-5671", "Amazon", "Echo Dot (5th Gen)", 49.99, "2026-07-05", "Delivered", "Credit Card"),
            ("ORD-8923", "Amazon", "Kindle Paperwhite", 139.99, "2026-08-10", "Delivered", "Credit Card"),
            ("ORD-1045", "Amazon", "Sony WF-1000XM4 Earbuds", 278.00, "2026-08-25", "Delivered", "UPI - GPay"),
            ("ORD-9932", "Flipkart", "Samsung Galaxy S24", 799.00, "2026-09-02", "Shipped", "Credit Card"),
            ("ORD-7711", "Swiggy", "Margherita Pizza", 14.50, "2026-09-04", "Delivered", "UPI - PhonePe")
        ]
        conn.executemany(
            "INSERT INTO orders (order_id, merchant, product, amount, order_date, status, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?)",
            demo_orders
        )
        conn.commit()
    conn.close()

@app.on_event("startup")
def on_startup():
    init_db()

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
