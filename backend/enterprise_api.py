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
    count = cursor.fetchone()[0]
    if count < 32:
        print("Auto-seeding / Syncing Demo Database for visitors...")
        demo_orders = [
            # --- January 2026 ---
            ("ORD-1028", "Amazon", "boAt Rockerz 450 Bluetooth Headphones", 1499.00, "2026-01-28", "Delivered", "UPI - BHIM"),
            
            # --- March 2026 ---
            ("ORD-3315", "Myntra", "Roadster Men Navy Blue Solid Denim Jacket", 1899.00, "2026-03-15", "Delivered", "CRED Pay"),
            ("ORD-6104", "Spotify", "Spotify Premium Family Plan (Annual Subscription)", 1799.00, "2026-03-25", "Delivered", "UPI - Paytm"),
            
            # --- May 2026 ---
            ("ORD-4410", "Flipkart", "Noise ColorFit Pulse Smartwatch", 1799.00, "2026-05-10", "Delivered", "UPI - Navi"),
            ("ORD-8201", "RentoMojo", "Apple MacBook Pro 16 M3 (Monthly Rental - 6 Month Tenure)", 4299.00, "2026-05-18", "Delivered", "HDFC NetBanking"),
            
            # --- July 2026 ---
            ("ORD-5671", "Amazon", "Echo Dot (5th Gen)", 4499.00, "2026-07-05", "Delivered", "HDFC Credit Card"),
            ("ORD-5501", "MakeMyTrip", "IndiGo Flight BOM to DEL (PNR: 6E-2849, Non-Stop)", 6450.00, "2026-07-12", "Delivered", "Axis Bank Credit Card"),
            ("ORD-7301", "BookMyShow", "Coldplay Music of the Spheres World Tour (2 Diamond Passes)", 14500.00, "2026-07-20", "Delivered", "CRED Pay"),
            
            # --- August 2026 ---
            ("ORD-8202", "RentoMojo", "Ergonomic Office Chair & Workstation Table (Rental)", 1199.00, "2026-08-01", "Delivered", "UPI - Navi"),
            ("ORD-5502", "Booking.com", "Taj Lands End Mumbai (2 Nights Luxury Deluxe Room)", 28900.00, "2026-08-05", "Delivered", "HDFC Credit Card"),
            ("ORD-8923", "Amazon", "Kindle Paperwhite 16GB", 12999.00, "2026-08-10", "Delivered", "ICICI NetBanking"),
            ("ORD-9401", "BGMI", "3,850 Unknown Cash (UC) + Royale Pass Season A7", 3800.00, "2026-08-15", "Delivered", "UPI - Google Pay"),
            ("ORD-6218", "Meesho", "Embroidered Anarkali Kurta Set", 749.00, "2026-08-18", "Delivered", "Cash on Delivery"),
            ("ORD-6101", "LinkedIn", "LinkedIn Premium Career Plan (Monthly Recurring)", 1499.00, "2026-08-20", "Delivered", "HDFC Credit Card Auto-Debit"),
            ("ORD-1045", "Amazon", "Sony WF-1000XM4 Noise Canceling Earbuds", 19990.00, "2026-08-25", "Delivered", "UPI - GPay"),
            ("ORD-6102", "Naukri", "Naukri FastForward Resume Display & Job Spotlight (3 Months)", 3250.00, "2026-08-26", "Delivered", "ICICI Credit Card"),
            ("ORD-6528", "Meesho", "Men Pure Cotton Casual Regular Shirt", 499.00, "2026-08-28", "Delivered", "UPI - BharatPe"),
            
            # --- September 2026 ---
            ("ORD-6103", "Netflix", "Netflix Premium 4K UHD Multi-Screen (Monthly Mandate)", 649.00, "2026-09-01", "Delivered", "CRED E-Mandate"),
            ("ORD-9932", "Amazon", "Samsung Galaxy S24 Ultra 5G", 79999.00, "2026-09-02", "Delivered", "SBI Credit Card"),
            ("ORD-3891", "Myntra", "Puma Men Black Dazzler Running Shoes", 2499.00, "2026-09-03", "Delivered", "UPI - PhonePe"),
            ("ORD-7711", "Zomato", "Margherita Pizza & Cheesy Garlic Bread", 485.00, "2026-09-04", "Delivered", "UPI - PhonePe"),
            ("ORD-5104", "Swiggy", "Hyderabadi Chicken Dum Biryani", 380.00, "2026-09-05", "Delivered", "UPI - GPay"),
            ("ORD-9402", "Free Fire", "2,180 In-Game Diamonds + Elite Pass Bundle", 1599.00, "2026-09-06", "Delivered", "UPI - BharatPe"),
            ("ORD-7302", "BookMyShow", "IMAX 3D: Interstellar Re-Release (2 Recliner Seats)", 1200.00, "2026-09-08", "Delivered", "UPI - BHIM"),
            ("ORD-2110", "Blinkit", "Amul Taaza Milk (1L), Bread & Organic Eggs", 165.00, "2026-09-10", "Delivered", "UPI - Paytm"),
            ("ORD-2111", "Zepto", "Fresh Nagpur Oranges (1kg) & Robusta Bananas", 210.00, "2026-09-10", "Delivered", "UPI - PhonePe"),
            ("ORD-5503", "ixigo", "Vande Bharat Express AC Chair Car (PNR: 2849104819)", 1680.00, "2026-09-11", "Delivered", "UPI - BHIM"),
            ("ORD-7303", "District", "Sunburn Arena EDM Music Festival Pass", 3500.00, "2026-09-12", "Delivered", "UPI - PhonePe"),
            ("ORD-6714", "Meesho", "Floral Print Georgette Saree with Blouse Piece", 620.00, "2026-09-14", "Delivered", "Cash on Delivery"),
            ("ORD-9403", "Steam", "Grand Theft Auto VI - Deluxe Edition (Pre-Order)", 5499.00, "2026-09-14", "Delivered", "SBI YONO NetBanking"),
            ("ORD-5915", "Swiggy", "Cold Coffee & Dark Chocolate Brownie", 290.00, "2026-09-15", "Delivered", "CRED UPI"),
            ("ORD-9116", "Flipkart", "Logitech MX Master 3S Wireless Mouse", 8495.00, "2026-09-15", "Shipped", "Axis Bank Credit Card")
        ]
        for o in demo_orders:
            conn.execute(
                "INSERT OR REPLACE INTO orders (order_id, merchant, product, amount, order_date, status, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?)",
                o
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
def search_orders(merchant: Optional[str] = None, payment_mode: Optional[str] = None, order_date: Optional[str] = None, query: Optional[str] = None):
    conn = get_db()
    sql = "SELECT * FROM orders WHERE 1=1"
    params = []
    if merchant:
        sql += " AND LOWER(merchant) LIKE ?"
        params.append(f"%{merchant.lower()}%")
    if payment_mode:
        sql += " AND LOWER(payment_mode) LIKE ?"
        params.append(f"%{payment_mode.lower()}%")
    if order_date:
        sql += " AND order_date LIKE ?"
        params.append(f"%{order_date}%")
    if query:
        sql += " AND (LOWER(product) LIKE ? OR LOWER(merchant) LIKE ? OR LOWER(order_id) LIKE ?)"
        q_like = f"%{query.lower()}%"
        params.extend([q_like, q_like, q_like])
    sql += " ORDER BY order_date DESC LIMIT 15"
        
    rows = conn.execute(sql, params).fetchall()
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
