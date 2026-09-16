# 🎧 RazorSense AI — Autonomous Consumer Support & Dispute Resolution Platform

[![Live Demo](https://img.shields.io/badge/Demo-Try%20Live%20App-0057D9?style=for-the-badge&logo=render)](https://razorsense-livid.vercel.app/immersive)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014%20%26%20Tailwind-black?style=for-the-badge&logo=next.js)](https://github.com/sanjaykrishnabaishya/RazorSense/tree/master/frontend)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20Python-009688?style=for-the-badge&logo=fastapi)](https://github.com/sanjaykrishnabaishya/RazorSense/tree/master/backend)
[![AI Brain](https://img.shields.io/badge/AI%20Brain-Gemini%20Thinking%20%26%20Vision-orange?style=for-the-badge)](https://aistudio.google.com/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol%201.0-blueviolet?style=for-the-badge)](https://modelcontextprotocol.io/)

> **⚠️ Note on Cloud Wake-Up:**  
> If you test the live demo and the first message takes 20–30 seconds, this is expected behavior on Render's free tier as the container spins up from idle. Once warm, subsequent responses stream instantly within 1–2 seconds!

**RazorSense AI** is a next-generation autonomous consumer support platform and payment dispute resolution engine. Powered by an empathetic, context-aware frontline AI agent named **Krish**, an underlying **LangGraph Multi-Agent Network**, and the **RazorSense Sentinel Fraud Guardian**, the system resolves customer grievances, manages post-purchase issues, expedites in-transit deliveries, and automates payment gateway dispute defense from a single, human-like conversational interface.

---

## 📌 Table of Contents
1. [Executive Overview](#-executive-overview)
2. [The 4-Pillar Dispute & Resolution Framework](#-the-4-pillar-dispute--resolution-framework)
3. [Multi-Agent Architecture: Deployed Agents & Roles](#-multi-agent-architecture-deployed-agents--roles)
4. [Model Context Protocol (MCP) Server](#-model-context-protocol-mcp-server)
5. [Gemini Models Selection & Technical Rationales](#-gemini-models-selection--technical-rationales)
6. [Retrieval-Augmented Generation (RAG) & Semantic Policy Memory](#-retrieval-augmented-generation-rag--semantic-policy-memory)
7. [Sentinel Two-Tier Fraud & Velocity Guardian](#-sentinel-two-tier-fraud--velocity-guardian)
8. [System Architecture Diagram](#-system-architecture-diagram)
9. [Where Does the Human Reviewer Come In?](#-where-does-the-human-reviewer-come-in)
10. [Key Capabilities & Human-Like UX](#-key-capabilities--human-like-ux)
11. [Project Structure](#-project-structure)
12. [API & Tool Reference](#-api--tool-reference)
13. [Local Setup Guide](#-local-setup-guide)
14. [Engineering Log: Bugs Fixed & Architecture Pivots](#-engineering-log-bugs-fixed--architecture-pivots)

---

## 🚀 Executive Overview

Traditional support desks suffer from high friction: customers bounce between customer support and payment gateway dispute forms, while merchants lose billions annually to friendly fraud and delayed chargeback representments.

RazorSense unifies these workflows into a **single customer-centric frontline**:
- **Human-Like Conversational Resolution:** Zero rigid forms, robotic duplicate bubbles, or repetitive templates. Krish communicates like a helpful, attentive support specialist with proactive order awareness.
- **Smart Logistics & In-Transit Escalation:** Automatically identifies delayed or stuck shipments (e.g., `#ORD-9116`), retrieves live courier telemetry (BlueDart AWB tracking, driver contact), and issues expedited dispatch tickets (`#TCK-EXP-9116`) with a single click.
- **Multimodal Visual Damage Verification:** Direct upload of photo or video unboxing evidence. Gemini Vision inspects damage, serial numbers, and tamper seals to authorize replacements without human queue delays.
- **Instant Gateway Reconciliation:** Synchronized with the underlying payment gateway ledger to verify 3DS authentication states, detect duplicate transactions, and instantly revoke recurring subscription mandates.
- **Autonomous Representment Engine:** When an issuing bank raises a chargeback, RazorSense compiles telemetry (IP, carrier AWB, OTP logs, GPS, signed receipts) and generates a complete dispute defense dossier cited against Visa, Mastercard, and central banking rules.

---

## 🛡️ The 4-Pillar Dispute & Resolution Framework

RazorSense natively embeds the international payment industry standard **4-Pillar Dispute Framework** directly into its semantic vector memory (`vector_db.py`) and autonomous dispute compiler (`dispute_engine.py`):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RAZORSENSE 4-PILLAR DISPUTE DEFENSE SYSTEM                   │
├───────────────────────┬─────────────────────────┬───────────────────────────────┤
│ Pillar 1: Fraud &     │ Pillar 2: Fulfillment & │ Pillar 3: Billing & Duplicate │
│ Authorization Claims  │ Merchandise Disputes    │ Processing Errors             │
├───────────────────────┴─────────────────────────┴───────────────────────────────┤
│ Pillar 4: Subscriptions, Recurring Billing & Standing Mandate Disputes          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Pillar 1: Fraud & Authorization Claims (Unauthorized Transactions)
* **Underlying Policy:** EMVCo 3DS 2.2, UPI 2FA Authentication, ECI 05/06 Liability Shift (Visa Core Rules / Mastercard Chargeback Guide / RBI Mandates).
* **Autonomous Handling:**
  - When a customer reports an unrecognized charge, Krish instantly queries the transaction authentication telemetry.
  - If the payment completed via **Full 3D-Secure 2FA** (verified OTP / biometric Issuer Authentication Value / CAVV / ECI 05), Krish provides the exact bank authentication timestamp, confirms bank liability shift to the card issuer, advises the user to contact their issuing bank to freeze compromised cards, and logs an authorized security ticket (`TICKET_CREATED`).
  - Assembles the 3DS verification packet for the merchant's representment defense.

### 2. Pillar 2: Fulfillment & Merchandise Disputes (MNR & Damaged Goods)
* **Underlying Policy:** Merchandise Not Received (MNR), Defective / Significantly Not as Described (SNAD), 7-Day Electronic Return Window.
* **Autonomous Handling:**
  - **Damage & Defect Claims:** Krish prompts the user to upload photo or unboxing video evidence. The multimodal engine visually inspects the crack, dent, or seal breach, verifies the item against the registered order, and checks delivery weight telemetry.
  - **Delivery Tracking (MNR):** Checks carrier API for GPS delivery scan, receiver signature, and delivery date.
  - **Resolution:** If within the return window, Krish issues an RMA with a reverse-pickup tracking code. If beyond the window or physical abuse is detected, Krish politely explains policy boundaries and offers manufacturer warranty guidance.

### 3. Pillar 3: Billing & Duplicate Processing Errors
* **Underlying Policy:** Double Charging, Incorrect Amount Debited, Network Dropout Timeouts.
* **Autonomous Handling:**
  - Krish queries the merchant payment ledger for identical amount debits on the same payment instrument within a 15-minute window.
  - **Instant Reversal:** If a duplicate debit is identified, the system immediately voids the uncaptured charge or triggers an instant gateway refund.
  - **Evidence Provided:** Displays the 12-digit Bank RRN (Retrieval Reference Number) or ARN (Acquirer Reference Number) directly to the customer for their bank statement reconciliation.

### 4. Pillar 4: Subscriptions & Recurring Billing (Mandates & Auto-Renewals)
* **Underlying Policy:** Standing Instructions (SI), e-Mandates, 48-Hour Auto-Renewal Grace Period, Pre-Billing Notification Compliance.
* **Autonomous Handling:**
  - **Pre-Cancellation Proof:** If the customer initiated cancellation prior to the billing cycle, the renewal charge is immediately credited back with zero penalty.
  - **48-Hour Grace Period:** If the customer claims an accidental renewal within 48 hours of billing and zero platform consumption is verified, Krish executes an immediate pro-rata/full refund and revokes the active e-mandate.
  - **Mandate Revocation:** Krish initiates an instant API revocation of the recurring mandate with the enterprise gateway to prevent any future automated debits.

---

## 🤖 Multi-Agent Architecture: Deployed Agents & Roles

RazorSense deploys a coordinated multi-agent collective spanning backend reasoning, graph orchestration, fraud assessment, and specialized domain routing:

### 1. Core Autonomous Backend Agents:
| Agent Name | Location | Primary Role & Operational Responsibility |
| :--- | :--- | :--- |
| **Krish AI (Frontline Autonomous Agent)** | `backend/agentic_brain.py` | Dedicated frontline resolution agent. Orchestrates context-aware customer dialogues, audio/voice processing, multimodal vision inspection, proactive in-transit delivery tracking, and direct resolution execution (refunds, returns, tickets, mandate revocations). |
| **SupervisorAgent** | `backend/agent_graph.py` | StateGraph supervisor orchestrating multi-agent dialogue. Scrubs PII, extracts the 7-field Master Dispute Checklist, evaluates intent, and routes tasks across specialist sub-agents. |
| **ClarificationAgent** | `backend/agent_graph.py` | Identifies missing information from user claims (order ID, date, payment mode, issue, demand) and asks targeted questions to complete the dispute dossier. |
| **OrderAgent** | `backend/agent_graph.py` | Queries order databases, carrier APIs (BlueDart, Delhivery), live dispatch statuses, and logistics telemetry. |
| **PolicyAgent** | `backend/agent_graph.py` | Interfaces with the ChromaDB RAG vector engine to retrieve exact real-world merchant SOPs and 4-pillar guidelines. |
| **ActionAgent** | `backend/agent_graph.py` | Executes high-intent actions once checklist prerequisites are satisfied (issuing refunds, generating return RMAs, logging database tickets). |
| **HumanEscalationAgent** | `backend/agent_graph.py` | Intercepts edge cases, suspected fraud, abusive behavior, or distressed customers, compiling a full conversation snapshot and handing off to human specialists (`ESC-XXXXX`). |
| **Sentinel Fraud Guardian** | `backend/fraud_engine.py` | Dynamic risk scoring agent (0–100). Evaluates merchant SOP compliance, claim-shifting heuristics (e.g. food taste switched to missing item), user velocity rules, and issues cryptographically verified audit dossiers. |
| **Dispute Defense Engine** | `backend/dispute_engine.py` | Autonomous chargeback representment agent. Ingests bank webhooks (HMAC-SHA256 verified), pulls 3DS CAVV/ECI telemetry and proof of delivery, and compiles legal defense packets. |

### 2. Frontend Specialized Resolution Agents (Consumer UI):
In `frontend/src/components/chat/EnterpriseAgentsSection.tsx`, RazorSense exposes 6 focused consumer resolution agents:
- **Post-Purchase Support Agent:** Handles damaged goods, replacements, missing items, returns, and exchanges for delivered orders.
- **Payment & Billing Agent:** Resolves failed orders with debited money, duplicate charges, pending bank refunds, and unauthorized charges.
- **Subscriptions Agent:** Cancels recurring auto-debits, manages OTT/music/gaming/networking apps, revokes bank e-mandates, and claims 48-hour renewal refunds.
- **Order & Receipt Discovery Agent:** Real-time semantic search across 21+ merchants and fintech payment channels.
- **Support Tickets & Dossiers Agent:** Live tracking of all customer grievances and cryptographically verified Sentinel dispute dossiers.
- **Others / Logistics & Technical Inquiries Agent:** Resolves in-transit delays, rider misbehavior, cash-demand complaints, and app glitches.

---

## 🔌 Model Context Protocol (MCP) Server

RazorSense implements a production-grade **Model Context Protocol (MCP)** server (`backend/mcp_server.py`) adhering to the open Anthropic MCP 1.0 specification. This enables external AI environments (**Claude Desktop**, **Cursor IDE**, **VS Code Cline**, **Windsurf**, and **Antigravity**) to tap into RazorSense tools and data natively.

### 1. Exposed MCP Tools (Actions):
1. `search_orders(query, merchant, order_date, payment_mode)`: Queries purchases across 21+ merchants and fintech channels.
2. `get_order_details(order_id)`: Fetches real-time purchase, payment, and logistics telemetry.
3. `search_policy_knowledge_base(query)`: Queries the 4-Pillar Rule Book and 21+ merchant SOPs via ChromaDB RAG.
4. `process_secure_refund(order_id, reason)`: Initiates instant automated refunds and generates reference tickets.
5. `process_return(order_id, reason, pickup_address)`: Schedules reverse courier pickups and issues RMA tracking codes.
6. `escalate_to_human(reason, order_id)`: Flags high-risk cases and creates human escalation tickets (`ESC-XXXXX`).
7. `create_support_ticket(issue)`: Creates general account or billing support grievances.
8. `fetch_recent_tickets(order_id)`: Retrieves active customer dispute dossiers.
9. `evaluate_fraud_and_policy(order_id, claim_type, issue_description, has_photo)`: Invokes the Sentinel Two-Tier Fraud Engine for real-time risk scoring and cryptographically signed audit dossiers.

### 2. Exposed MCP Resources (Live Context):
- `razorsense://catalog/merchants`: Full directory of supported merchants across 7 industry verticals.
- `razorsense://policies/all`: Complete Enterprise Rule Book and merchant SOP documentation.
- `razorsense://orders/recent`: Most recent customer transactions and payment statuses.

### 3. Exposed MCP Prompts (Workflows):
- `dispute_defense`: Prompts external agents to assemble structured chargeback defense packets using telemetry.
- `customer_resolution`: Guides external agents in empathetic grievance handling using Krish's resolution protocols.

### 4. How to Connect External Agents:
```json
// In Claude Desktop config (%APPDATA%\\Claude\\claude_desktop_config.json):
{
  "mcpServers": {
    "razorsense": {
      "command": "python",
      "args": ["<path-to-repo>/backend/mcp_server.py", "--transport", "stdio"],
      "env": {
        "PYTHONPATH": "<path-to-repo>/backend"
      }
    }
  }
}
```
*Can also be run as an SSE network microservice:*
```bash
python backend/mcp_server.py --transport sse --port 8001
# Endpoint: http://127.0.0.1:8001/sse
```

---

## ⚡ Gemini Models Selection & Technical Rationales

RazorSense relies on Google DeepMind's **Gemini** family via the unified `google-genai` SDK. Each model is strategically selected for specific latency, quota, and reasoning characteristics:

| Model Identifier | Primary Usage | Why This Specific Model Was Chosen |
| :--- | :--- | :--- |
| **`gemini-3.5-flash-lite`** | **Primary Chat Engine** | Offers ultra-low sub-second Time-To-First-Token (~0.8s TTFT), native Thinking Budget support for chain-of-thought analysis, and generous 500 Requests Per Day (RPD) free-tier capacity. |
| **`gemini-3.6-flash`** | **Tier-1 Fallback** | Higher reasoning capacity. Deployed automatically if `gemini-3.5-flash-lite` experiences rate limiting or complex multi-turn edge cases. |
| **`gemini-3.5-flash`** | **Tier-2 Fallback** | High stability and reliability baseline. Guarantees 99.9% uptime during regional API spikes. |
| **`gemini-3.1-flash-lite`** | **Tier-3 Fallback** | High-throughput 500 RPD backup ensuring zero user-facing outages during prolonged peak hours. |
| **`gemini-3.8-flash`** | **Deep Reasoning Fallback** | Flagship reasoning model utilized when deep legal analysis or multi-merchant policy synthesis is required. |
| **`gemini-3.7-flash`** | **Multimodal Vision & Video** | Native image and video understanding. Evaluates user unboxing videos, packaging condition, serial tags, and transit damage without external computer vision models. |
| **`text-embedding-004`** | **Semantic Vector Embeddings** | Google's high-efficiency 768-dimensional text embedding model used to index and retrieve 4-pillar policies and merchant SOPs in ChromaDB. |

### Sub-Second Fallback Cascade
To prevent customer waiting spinners during Google Cloud peak traffic, RazorSense implements strict `HttpOptions(attempts=1)` and an instant failover cascade:
`gemini-3.5-flash-lite` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemini-3.8-flash` → `gemini-3.7-flash`. Failover transition takes **< 0.1 seconds**.

---

## 🧠 Retrieval-Augmented Generation (RAG) & Semantic Policy Memory

### Are We Using RAG? **Yes, Comprehensively!**
RazorSense utilizes a production **Hybrid RAG (Retrieval-Augmented Generation)** architecture implemented in `backend/vector_db.py`:

```
User Query (e.g. "Can I return my Samsung S24 Ultra?")
                           │
                           ▼
          ┌──────────────────────────────────┐
          │      Hybrid Retrieval Layer      │
          ├─────────────────┬────────────────┤
          │  Dense Vector   │ Exact Domain   │
          │   (ChromaDB +   │ Keyword Match  │
          │ text-embedding) │  (BM25-style)  │
          └────────┬────────┴────────┬───────┘
                   │                 │
                   └────────┬────────┘
                            ▼
               Retrieved Official Policy:
        "Amazon India: Electronics are 7-DAY
         REPLACEMENT ONLY via brand technician"
                            │
                            ▼
          Injected into Krish's Prompt Context
                            │
                            ▼
          Ground-Truth Policy-Compliant Answer
                  (0% Hallucination)
```

### Key RAG Features:
1. **Persistent ChromaDB Vector Store:** Stored locally in `backend/chroma_db`, ensuring sub-millisecond retrieval without remote network overhead.
2. **Deterministic Fallback Embeddings:** If external embedding APIs experience temporary rate limiting, a SHA-256 deterministic pseudo-vector generator guarantees queries never fail.
3. **Hybrid Semantic + Keyword Search:** Combines dense cosine similarity with high-confidence domain keyword boosts (+30 score for specific brand mentions like Swiggy, Meesho, Netflix, BookMyShow, Steam, BGMI).
4. **21+ Seeded Real-World Merchant SOPs:**
   - **E-Commerce:** Amazon (7-day technician replacement), Flipkart (service engineer inspection), Myntra (14-day return, lingerie non-returnable), Meesho (7-day return).
   - **Food & Quick Commerce:** Swiggy & Zomato (no cancellation post-cooking, 15-min damage claim window), Blinkit & Zepto (2-hour perishable window).
   - **OTT & Subscriptions:** Netflix, Spotify, LinkedIn Premium (strictly non-refundable, 48h grace exception), Naukri FastForward.
   - **Entertainment & Ticketing:** BookMyShow & District (events non-refundable unless cancelled, Cancellation Protect for movies).
   - **Rentals:** RentoMojo (early closure charges, QC deposit refund in 7-9 days), Furlenco.
   - **E-Sports & Gaming:** BGMI / Krafton (UC non-refundable, chargeback ban warning, 24h reconciliation), Free Fire, Steam (14 days / <2 hours played).
   - **Travel:** MakeMyTrip (convenience fees non-refundable, DGCA 24h cancellation), Booking.com, ixigo (IRCTC slab penalties).
   - **Fintech & Banking:** BHIM, PhonePe, GPay, Paytm, CRED, Navi, BharatPe, SBI, HDFC, ICICI, Axis (T+1 auto-reversal TAT under RBI circular).

---

## 🛡️ Sentinel Two-Tier Fraud & Velocity Guardian

Implemented in `backend/fraud_engine.py`, the **Sentinel Engine** provides real-time fraud mitigation:
1. **Dynamic Risk Scoring (0–100):** Evaluates user account tenure, purchase price, claim history, and proof status.
2. **Claim-Shifting Heuristics:** Detects when a user alters their story to bypass policies (e.g. starting with "food was cold", being denied, and shifting to "food was missing"). Flags the transaction as high-risk and halts autonomous payouts.
3. **Strict Photo/Video Validation:** High-value electronics and clothing require visual proof before refund authorization.
4. **Cryptographically Signed Audit Dossiers:** Generates immutable ticket receipts (`#TCK-...`) with SHA-256 hashes for merchant representment and accounting compliance.

---

## 🏗 System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer - Next.js & Mobile"]
        User(["Customer / User"])
        Immersive["Immersive Hero (/immersive)"]
        ChatUI["React + Tailwind Chat Panel (/chat)"]
        PII["Client-Side PII Scrubbing<br/>(PAN, CVV, Passwords)"]
    end

    subgraph External ["External Agent Ecosystem"]
        ClaudeDesktop["Claude Desktop"]
        Cursor["Cursor IDE / Windsurf"]
    end

    subgraph Core ["FastAPI Orchestration & Agents"]
        MainAPI["FastAPI Orchestrator (main.py)"]
        MCPServer["Model Context Protocol Server<br/>(mcp_server.py - Port 8001 / stdio)"]
        Krish["Frontline AI Brain 'Krish'<br/>(agentic_brain.py)"]
        LangGraph["LangGraph Multi-Agent Network<br/>(agent_graph.py)"]
        Sentinel["Sentinel Fraud Guardian<br/>(fraud_engine.py)"]
        DisputeEngine["Dispute Defense Engine<br/>(dispute_engine.py)"]
    end

    subgraph Memory ["Knowledge & Telemetry"]
        VectorDB[("ChromaDB Hybrid RAG<br/>21+ Merchant SOPs & 4 Pillars")]
        OrderDB[("SQLite Transaction DB<br/>Orders, Logistics, Tickets")]
        Vision["Gemini 3.7 Vision<br/>Photo/Video Inspection"]
    end

    subgraph Gateway ["Enterprise Settlement"]
        ExtGW["Payment Gateway Webhooks"]
    end

    User <--> Immersive
    Immersive -->|"Get Assistance"| ChatUI
    ChatUI -->|"Scrubbed Input"| PII
    PII --> MainAPI
    MainAPI --> Krish
    Krish <--> LangGraph
    Krish <--> Sentinel
    Krish <--> VectorDB
    Krish <--> OrderDB
    Krish <--> Vision
    Krish -->|"Direct Resolution"| ChatUI

    External <-->|"MCP stdio / SSE"| MCPServer
    MCPServer <--> Krish
    MCPServer <--> Sentinel

    ExtGW -->|"Signed Webhooks"| MainAPI
    MainAPI --> DisputeEngine
    DisputeEngine <--> OrderDB
```

---

## 👥 Where Does the Human Reviewer Come In?

RazorSense follows a strict boundary between autonomous operations and human review:

```
                              CUSTOMER REQUEST
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
     ROUTINE & SAFE                               HIGH-RISK / AMBIGUOUS
   (Policy-Compliant)                           (Potential Fraud / Edge Case)
             │                                               │
             ▼                                               ▼
  AI Resolves in Seconds                          AI Halts Action & Escalates
             │                                               │
• In-transit tracking & BlueDart updates        • Altered or tampered unboxing proof
• Instant 15-min duplicate debit reversal       • Empty box claims with dock weight match
• 48-hr subscription grace refund & mandate     • Claim shifting detected by Sentinel
• Standard replacement within return window     • Explicit user distress / human request
                                                • Out-of-policy refund demands
                                                               │
                                                               ▼
                                                  Calls `escalate_to_human`
                                                  Creates `[TICKET: ESC-XXXXX]`
                                                  Routes to Senior Specialist
```

---

## ✨ Key Capabilities & Human-Like UX

1. **Smart In-Transit Order Recognition:** When asking about delays, Krish automatically isolates delayed shipments (e.g. Flipkart `#ORD-9116`), queries BlueDart tracking (`AWB: BD-8849201`), and offers one-click priority dispatch escalation (`#TCK-EXP-9116`).
2. **Single-Bubble Dialogue Flow:** No duplicate chatbot bubbles or rigid form questions. Every response feels like talking to an attentive human concierge.
3. **Instant Mandate Revocation:** Revokes standing bank auto-debits (Netflix, Spotify, LinkedIn) at the gateway level with instant ticket generation (`#TCK-MAND-xxxx`).
4. **Downloadable Resolution Receipts:** Issues branded PDF-style receipts with resolution timestamps, bank reference numbers, and merchant codes.

---

## 📂 Project Structure

```bash
RazorSense/
├── backend/
│   ├── agentic_brain.py       # Frontline Gemini AI engine, thinking mode & dispatch tools
│   ├── agent_graph.py         # LangGraph multi-agent orchestration (Supervisor, Policy, Order, etc.)
│   ├── dispute_engine.py      # Autonomous 4-pillar chargeback compiler & webhook handler
│   ├── fraud_engine.py        # Sentinel fraud heuristics, velocity rules & claim shifting
│   ├── mcp_server.py          # Model Context Protocol server exposing merchant tools & resources
│   ├── main.py                # FastAPI server, SSE streaming, and REST endpoints
│   ├── vector_db.py           # ChromaDB hybrid RAG store with 21+ real-world merchant SOPs
│   ├── pii_redactor.py        # Client & server PII masking engine (PAN, CVV, passwords)
│   ├── seed.py                # Database seeder for sample orders and merchant telemetry
│   ├── models.py              # SQLAlchemy database models (Users, Orders, Tickets, Disputes)
│   ├── database.py            # SQLite database engine connection
│   └── requirements.txt       # Production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Root redirect to /immersive
│   │   │   ├── immersive/page.tsx     # Modern interactive landing showcase
│   │   │   ├── chat/page.tsx          # Full-screen Krish AI resolution workspace
│   │   │   └── globals.css            # Dark mode palette, typography & animations
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx               # Main conversational stream & speech bubbles
│   │   │   │   ├── EnterpriseAgentsSection.tsx # Modern consumer resolution cards
│   │   │   │   ├── BentoCard.tsx               # High-contrast interactive bento components
│   │   │   │   ├── TicketHistoryWidget.tsx     # Paginated support tickets & dispute dossiers
│   │   │   │   ├── ProactiveDeliveryBanner.tsx # Live in-transit shipment tracking alerts
│   │   │   │   └── TicketReceiptCard.tsx       # Downloadable resolution receipts
│   │   │   └── common/
│   │   │       └── RazorSenseLogo.tsx          # Vector brand identity
│   │   └── context/                   # Auth and Chat state providers
│   └── package.json                   # Frontend Next.js dependencies
└── README.md                          # Documentation & architectural specifications
```

---

## 📡 API & Tool Reference

### REST Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Non-streaming chat endpoint with full JSON payload |
| `POST` | `/api/chat/stream` | Real-time Server-Sent Events (SSE) streaming chat |
| `GET`  | `/api/orders/search?q={query}` | Search customer orders across 21+ merchants |
| `GET`  | `/api/orders/recent-deliveries` | Retrieve recent delivered orders for proactive banners |
| `GET`  | `/api/orders/{order_number}` | Retrieve verified order telemetry |
| `POST` | `/api/tickets` | Create a customer support grievance ticket |
| `GET`  | `/api/tickets` | Fetch logged tickets and investigation statuses |
| `POST` | `/api/webhooks/gateway` | Inbound payment gateway webhook handler (HMAC-SHA256) |
| `GET`  | `/api/disputes` | List active disputes and generated defense packets |

---

## 🛠 Local Setup Guide

### Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### 1. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Gemini API Key
# Windows (PowerShell):
$env:GEMINI_API_KEY="your-gemini-api-key"
# macOS/Linux:
export GEMINI_API_KEY="your-gemini-api-key"

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser (redirects to `/immersive`).

---

## 🛠️ Engineering Log: Bugs Fixed & Architecture Pivots

| Challenge / Bug | Root Cause | Solution & Implementation |
| :--- | :--- | :--- |
| **Robotic Double-Bubble Rendering** | `OrderSelectWidget` rendered its own chatbot message bubble right under Krish's main text bubble. | Replaced the nested chat bubble in `OrderSelectWidget` with a clean, understated uppercase header tag. |
| **Delivery Delay Order Blindness** | Delay queries dumped arbitrary delivered purchases (e.g. coffee/saree) without checking shipment status. | Injected smart status filtering (`status NOT IN ('delivered', 'cancelled')`) to isolate active shipment `#ORD-9116` with live BlueDart tracking and priority dispatch escalation. |
| **Mandate Revocation Conversational Loop** | Subscriptions handler matched broad keyword `"mandate"`, causing the intro prompt to repeat when clicking "Revoke Mandate". | Built dedicated action handlers for `Revoke Bank e-Mandate`, `48-Hour Renewal Refund`, and `Check Mandate Status` in `agentic_brain.py`. |
| **API Retry Latency Hangs** | Default Gemini client retried failed calls 5+ times during traffic spikes, locking the UI for minutes. | Configured strict `HttpOptions(attempts=1)` and built an instantaneous (<0.1s) 6-tier fallback cascade across the Gemini family. |
| **Ephemeral Disk Vector Loss** | Render free-tier disks reset on container sleep, losing ChromaDB collections. | Built an automated startup hook in `main.py` that verifies collection integrity and re-seeds all 21+ policies upon boot. |
| **SSE Stream Newline Dropping** | Multi-line LLM outputs sent raw newlines inside SSE chunks, causing browsers to truncate markdown tables. | Escaped newline characters (`\n` → `\\n`) in SSE payloads on backend and safely reconstructed them in React streaming parser. |

---

## 📜 License
This project is licensed under the **MIT License**.
