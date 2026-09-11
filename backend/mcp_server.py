import os
import json
import sqlite3
import datetime
import vector_db
from mcp.server.mcpserver import MCPServer

# Initialize FastMCP Server
mcp = MCPServer("RazorSense")

def get_enterprise_db():
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@mcp.tool()
def search_orders(merchant: str = None, payment_mode: str = None, order_date: str = None) -> str:
    """Search for orders using filters. If order_date is missing, returns the last 10 orders matching the merchant/payment."""
    try:
        conn = get_enterprise_db()
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
            
        query += " ORDER BY order_date DESC LIMIT 10"
        
        rows = conn.execute(query, params).fetchall()
        conn.close()
        
        data = [dict(row) for row in rows]
        if not data:
            return json.dumps({"error": "No orders found matching those criteria."})
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"error": f"Database error: {e}"})

@mcp.tool()
def fetch_order_details(order_id: str) -> str:
    """Fetch real-time order details from the database. Use this to lookup orders by their exact Order ID."""
    order_id = str(order_id).replace(" ", "").upper()
    try:
        conn = get_enterprise_db()
        order = conn.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
        conn.close()
        if order:
            return json.dumps(dict(order))
        return json.dumps({"error": f"Order {order_id} not found."})
    except Exception as e:
        return json.dumps({"error": f"Database error: {e}"})

@mcp.tool()
def fetch_recent_tickets(order_id: str = None) -> str:
    """Fetch recent support tickets from the database."""
    try:
        conn = get_enterprise_db()
        query = "SELECT * FROM tickets WHERE 1=1"
        params = []
        if order_id:
            query += " AND order_id = ?"
            params.append(order_id)
        query += " ORDER BY id DESC LIMIT 5"
        
        rows = conn.execute(query, params).fetchall()
        conn.close()
        
        data = [dict(row) for row in rows]
        if not data:
            return json.dumps({"error": "No recent tickets found."})
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"error": f"Database error: {e}"})

@mcp.tool()
def search_knowledge_base(query: str) -> str:
    """Search company policy using the Vector Database."""
    try:
        policy = vector_db.query_knowledge_base(query)
        return json.dumps({"policy": policy})
    except Exception as e:
        return json.dumps({"error": f"Vector DB Error: {e}"})

if __name__ == "__main__":
    print("Starting RazorSense MCP Server on stdio...")
    mcp.run()
