# ?? RazorSense Model Context Protocol (MCP) Server Setup Guide

RazorSense exposes an official, enterprise-grade **Model Context Protocol (MCP)** server on localhost.
External AI agents (Claude Desktop, Cursor IDE, VS Code Cline / Roo Code, Antigravity) can connect directly to RazorSense to query purchases, search SOP policies, initiate refunds, schedule returns, and access dispute defense prompts with zero custom API code.

---

## ??? Architecture Overview

`
                        +----------------------------+
                        |  Claude Desktop / Cursor   |
                        |     / Antigravity IDE      |
                        +--------------+-------------+
                                       |
                   stdio / SSE Streamable HTTP Transport
                                       |
                                       v
                     +---------------------------------+
                     |   backend/mcp_server.py         |
                     |  (FastMCP / MCP 2.x Server)     |
                     +---+------------+------------+---+
                         |            |            |
                         v            v            v
                   [ 8 Tools ]  [ 3 Resources ]  [ 2 Prompts ]
                         |            |
                         +-----+------+
                               |
                               v
                     +-------------------+
                     | SQLite (rz_db)    |
                     | + ChromaDB / BM25 |
                     +-------------------+
`

---

## ??? 1. Connecting to Claude Desktop

Add RazorSense to your Claude Desktop configuration file:

- **Windows**: %APPDATA%\Claude\claude_desktop_config.json
- **macOS**: ~/Library/Application Support/Claude/claude_desktop_config.json

`json
{
   mcpServers: {
    razorsense: {
      command: python,
      args: [
        c:/Users/Asus/OneDrive/Desktop/RazorSense/razorsense-app/backend/mcp_server.py,
        --transport,
        stdio
      ],
      env: {
        PYTHONPATH: c:/Users/Asus/OneDrive/Desktop/RazorSense/razorsense-app/backend
      }
    }
  }
}
`

Restart Claude Desktop. You will see a hammer icon ?? with all 8 RazorSense tools and resources available.

---

## ?? 2. Connecting to Cursor IDE / Windsurf

In Cursor settings under **Features > MCP Servers > Add New MCP Server**:

- **Name**: azorsense
- **Type**: command (stdio)
- **Command**: python c:/Users/Asus/OneDrive/Desktop/RazorSense/razorsense-app/backend/mcp_server.py --transport stdio

---

## ?? 3. Running as an SSE / HTTP Network Service

If you want to connect web-based agents, microservices, or multiple agents across localhost ports:

`ash
# Run MCP over Server-Sent Events on port 8001
python backend/mcp_server.py --transport sse --port 8001
`

Client SSE endpoint: http://127.0.0.1:8001/sse

---

## ?? 4. Testing & Verification

We have provided an automated test suite to verify all tools, resources, and prompts:

`ash
python backend/test_mcp_client.py
`

Expected output:
`	ext
[1/5] Testing MCP Tools List & Schemas... -> 8 registered tools
[2/5] Testing MCP Resources List...       -> 3 registered resources
[3/5] Testing MCP Prompts List...         -> 2 registered prompts
[4/5] Executing Live MCP Tool Calls...     -> search_orders, get_order_details, search_policy_knowledge_base passed
[5/5] Testing Resource Reading & Prompt...-> Catalog loaded, prompt rendered
?? ALL LOCALHOST MCP SERVER TESTS PASSED SUCCESSFULLY!
`

---

## ?? Summary of Available Capabilities

### 8 Native Tools:
1. search_orders(query, merchant, order_date, payment_mode): Fast lookup across 32+ catalog transactions (RentoMojo, BookMyShow, BGMI, Swiggy, Amazon, etc.).
2. get_order_details(order_id): Item specifications, delivery logs, payment provider, and return eligibility window.
3. search_policy_knowledge_base(query): 4-Pillar enterprise rule book and industry domain SOPs.
4. process_secure_refund(order_id, reason): Real-time atomic refund state update in z_db.sqlite.
5. process_return(order_id, reason, pickup_address): Courier return pickup scheduling.
6. escalate_to_human(reason, order_id): Fraud / 3DS investigation escalation.
7. create_support_ticket(issue): General support grievance logging.
8. etch_recent_tickets(order_id): Past customer complaints history.

### 3 MCP Resources:
1. azorsense://catalog/merchants: Full list of supported merchants and categories.
2. azorsense://policies/all: Complete SOP policies.
3. azorsense://orders/recent: Live transaction feed.

### 2 MCP Prompts:
1. dispute_defense: Evidence compilation template for chargebacks.
2. customer_resolution: Krish standard customer empathy and resolution workflow.
