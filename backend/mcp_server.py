import sys
import os
import json

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from mcp.server.mcpserver import MCPServer
import agentic_brain
import vector_db

# Initialize RazorSense MCP Server
server = MCPServer(
    name="razorsense",
    title="RazorSense Omnichannel Dispute Defense & Support Engine",
    description="Enterprise MCP server providing real-time order tracking, dispute resolution, policy verification, and automated refunds across Rentals, Event Ticketing, Gaming, Subscriptions, Travel, and Fintech channels.",
    version="1.0.0"
)

# ---------------------------------------------------------
# 1. MCP TOOLS (Callable actions for AI models)
# ---------------------------------------------------------

@server.tool()
def search_orders(
    query: str = None,
    merchant: str = None,
    order_date: str = None,
    payment_mode: str = None
) -> str:
    """Search customer purchase records and order history across 21+ merchants and fintech channels.
    - query: Keyword matching product name, item category, or order ID (e.g., 'headphones', 'macbook', 'coldplay', 'diamonds', 'uc', 'flight', 'kurta')
    - merchant: Filter by merchant name (e.g., 'rentomojo', 'bookmyshow', 'district', 'bgmi', 'free fire', 'steam', 'linkedin', 'naukri', 'netflix', 'spotify', 'makemytrip', 'booking.com', 'ixigo', 'meesho', 'myntra', 'amazon', 'zomato', 'swiggy', 'blinkit', 'zepto', 'flipkart')
    - order_date: Date substring in YYYY-MM-DD format (e.g., '2026-01-28', '2026-09-10', '2026-08')
    - payment_mode: Filter by payment method (e.g., 'BHIM', 'Navi', 'BharatPe', 'CRED', 'PhonePe', 'GPay', 'Paytm', 'HDFC', 'ICICI', 'SBI', 'Axis', 'Cash on Delivery')
    """
    return agentic_brain.search_orders(
        merchant=merchant,
        payment_mode=payment_mode,
        order_date=order_date,
        query=query
    )

@server.tool()
def get_order_details(order_id: str) -> str:
    """Fetch exact real-time order details (product, merchant, amount, date, fulfillment status, payment method) using an Order ID (e.g. 'ORD-1028', 'ORD-8201', 'ORD-7301')."""
    return agentic_brain.fetch_order_details(order_id=order_id)

@server.tool()
def search_policy_knowledge_base(query: str) -> str:
    """Search the 4-Pillar Enterprise Rule Book and specialized industry SOPs (Rentals security deposits, BookMyShow movie/concert rules, E-sports/gaming UC & diamond delivery, LinkedIn/OTT 48-hr grace period, DGCA flight delays, UPI auto-reversal TAT)."""
    return json.dumps({"policy": vector_db.query_knowledge_base(query)})

@server.tool()
def process_secure_refund(order_id: str, reason: str) -> str:
    """Initiates a secure 100% refund for an eligible customer order and generates a tracking ticket reference (e.g. REF-12345)."""
    return agentic_brain.process_secure_refund(order_id=order_id, reason=reason)

@server.tool()
def process_return(order_id: str, reason: str, pickup_address: str) -> str:
    """Schedules a courier return pickup for physical merchandise or rental equipment and generates an RMA tracking reference (e.g. RMA-1234)."""
    return agentic_brain.process_return(order_id=order_id, reason=reason, pickup_address=pickup_address)

@server.tool()
def escalate_to_human(reason: str, order_id: str = "N/A") -> str:
    """Escalates a complex case, suspected fraud, unauthorized card debits, or exception requests to human review, returning an ESC- ticket ID."""
    return agentic_brain.escalate_to_human(reason=reason, order_id=order_id)

@server.tool()
def create_support_ticket(issue: str) -> str:
    """Creates a general support grievance ticket (e.g. GEN-12345) for account, billing, or non-order payment issues."""
    return agentic_brain.create_general_support_ticket(issue=issue)

@server.tool()
def fetch_recent_tickets(order_id: str = None) -> str:
    """Fetches recent support tickets logged in the enterprise database, optionally filtered by order_id."""
    return agentic_brain.fetch_recent_tickets(order_id=order_id)

# ---------------------------------------------------------
# 2. MCP RESOURCES (Live contextual documents)
# ---------------------------------------------------------

@server.resource("razorsense://catalog/merchants")
def get_merchant_catalog() -> str:
    """Exposes the full catalog of 21+ supported merchants across 7 industry verticals."""
    catalog = {
        "rentals": ["RentoMojo", "Furlenco"],
        "entertainment_and_events": ["BookMyShow", "District", "Paytm Insider"],
        "esports_and_gaming": ["BGMI / Krafton", "Free Fire", "Steam", "PlayStation Network"],
        "career_and_subscriptions": ["LinkedIn Premium", "Naukri FastForward", "Netflix", "Spotify"],
        "travel_and_hospitality": ["MakeMyTrip", "Booking.com", "ixigo", "Cleartrip"],
        "food_and_quick_commerce": ["Swiggy", "Zomato", "Blinkit", "Zepto"],
        "ecommerce": ["Amazon", "Flipkart", "Myntra", "Meesho"],
        "fintech_payment_channels": ["BHIM UPI", "Navi", "BharatPe", "CRED", "PhonePe", "GPay", "Paytm", "HDFC NetBanking", "ICICI Credit Card", "SBI YONO", "Axis Bank"]
    }
    return json.dumps(catalog, indent=2)

@server.resource("razorsense://policies/all")
def get_all_policies() -> str:
    """Exposes the complete Enterprise Rule Book and Domain SOPs for customer support grounding."""
    return "\n\n---\n\n".join(vector_db.ENTERPRISE_POLICIES)

@server.resource("razorsense://orders/recent")
def get_recent_orders() -> str:
    """Returns the most recent customer orders from the enterprise database."""
    return agentic_brain.search_orders()

# ---------------------------------------------------------
# 3. MCP PROMPTS (Pre-configured agent workflows)
# ---------------------------------------------------------

@server.prompt("dispute_defense")
def dispute_defense_prompt(order_id: str, issue_type: str) -> str:
    """Generates an evidence compilation prompt for defending against payment disputes and chargebacks."""
    return f"""You are RazorSense Dispute Defense AI.
Examine Order ID: {order_id} for reported issue: '{issue_type}'.
1. Call `get_order_details` to verify order status, delivery timestamp, and payment mode.
2. Call `search_policy_knowledge_base` to retrieve the relevant dispute policy.
3. Check if 3D-Secure authentication, OTP, carrier tracking, or hardware telemetry applies.
4. Produce a structured dispute resolution recommendation with clear next steps."""

@server.prompt("customer_resolution")
def customer_resolution_prompt(order_id: str) -> str:
    """Guides an empathetic customer grievance resolution workflow using Krish's enterprise standard."""
    return f"""You are Krish, the AI Support Agent for RazorSense.
Assist the customer with Order ID: {order_id}.
1. Proactively state the order details (product, merchant, order date, status).
2. Ask empathetic clarifying questions about the customer's grievance.
3. Apply the appropriate domain SOP from the knowledge base.
4. If eligible, initiate refund or replacement with the corresponding ticket ID."""

# ---------------------------------------------------------
# 4. SERVER ENTRYPOINT
# ---------------------------------------------------------

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="RazorSense MCP Server")
    parser.add_argument("--transport", default="stdio", choices=["stdio", "sse", "streamable-http"], help="Transport protocol (default: stdio)")
    parser.add_argument("--port", type=int, default=8001, help="Port for SSE or HTTP transport (default: 8001)")
    args = parser.parse_args()

    print(f"[RazorSense MCP] Starting server using transport: {args.transport}", file=sys.stderr)
    if args.transport == "stdio":
        server.run(transport="stdio")
    elif args.transport == "sse":
        server.run(transport="sse", port=args.port)
    else:
        server.run(transport="streamable-http", port=args.port)
