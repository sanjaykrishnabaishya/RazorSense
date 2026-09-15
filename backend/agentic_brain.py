import os
import json
import random
import base64
import requests
from typing import List, Dict, Any
from google import genai
from google.genai import types
from dotenv import load_dotenv

import datetime
from typing import List, Dict, Any, Generator

load_dotenv("../.env")

# Use Railway PORT if available, fallback to 8000 for local dev
INTERNAL_PORT = os.environ.get("PORT", "8000")
API_BASE_URL = os.environ.get("ENTERPRISE_API_URL", f"http://127.0.0.1:{INTERNAL_PORT}/enterprise/api/v2")

import sqlite3
import os

def get_enterprise_db():
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def fetch_order_details(order_id: str) -> str:
    """Fetch real-time order details from the database. Use this to lookup orders by their exact Order ID."""
    order_id = str(order_id).replace(" ", "").upper()
    try:
        conn = get_enterprise_db()
        order = conn.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
        conn.close()
        if order:
            return json.dumps(dict(order))
        return json.dumps({"error": f"Order {order_id} not found. Ask the user to verify the Order ID or use search_orders."})
    except Exception as e:
        return json.dumps({"error": f"Database error: {e}"})

def search_orders(merchant: str = None, payment_mode: str = None, order_date: str = None, query: str = None) -> str:
    """Search for orders in the database using filters.
    - query: Keyword matching product name, category, or order ID (e.g., 'headphones', 'macbook', 'coldplay', 'diamonds', 'uc', 'flight', 'kurta', 'ORD-1028')
    - merchant: Filter by merchant name (e.g., 'rentomojo', 'bookmyshow', 'district', 'bgmi', 'free fire', 'steam', 'linkedin', 'naukri', 'netflix', 'spotify', 'makemytrip', 'booking.com', 'ixigo', 'meesho', 'myntra', 'amazon', 'zomato', 'swiggy', 'blinkit', 'zepto', 'flipkart')
    - order_date: Exact date or substring in YYYY-MM-DD format (e.g., '2026-01-28', '2026-09', '2026-09-10')
    - payment_mode: Filter by payment method (e.g., 'BHIM', 'Navi', 'BharatPe', 'CRED', 'PhonePe', 'GPay', 'Paytm', 'HDFC', 'ICICI', 'SBI', 'Axis', 'Cash on Delivery')
    Returns matching orders ordered from newest to oldest.
    """
    try:
        conn = get_enterprise_db()
        sql = "SELECT * FROM orders WHERE 1=1"
        params = []
        if merchant:
            sql += " AND LOWER(merchant) LIKE ?"
            params.append(f"%{merchant.lower().strip()}%")
        if payment_mode:
            sql += " AND LOWER(payment_mode) LIKE ?"
            params.append(f"%{payment_mode.lower().strip()}%")
        if order_date:
            sql += " AND order_date LIKE ?"
            params.append(f"%{order_date.strip()}%")
        if query:
            sql += " AND (LOWER(product) LIKE ? OR LOWER(merchant) LIKE ? OR LOWER(order_id) LIKE ?)"
            q_clean = f"%{query.lower().strip()}%"
            params.extend([q_clean, q_clean, q_clean])
            
        sql += " ORDER BY order_date DESC LIMIT 15"
        
        rows = conn.execute(sql, params).fetchall()
        conn.close()
        
        data = [dict(row) for row in rows]
        if not data:
            return json.dumps({"error": "No orders found matching those criteria."})
        return json.dumps(data)
    except Exception as e:
        return json.dumps({"error": f"Database error: {e}"})

def _save_ticket_to_db(ticket_id: str, issue: str, status: str, action: str, order_id: str = "N/A"):
    # Fetch order details to get merchant and product
    merchant = "N/A"
    product = "N/A"
    if order_id != "N/A":
        try:
            conn = get_enterprise_db()
            order = conn.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
            conn.close()
            if order:
                merchant = order["merchant"]
                product = order["product"]
        except:
            pass
            
    try:
        conn = get_enterprise_db()
        conn.execute(
            "INSERT INTO tickets (ticket_id, order_id, merchant, product, issue, date, status, action_taken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (ticket_id, order_id, merchant, product, issue, datetime.datetime.now().strftime("%d %b %Y"), status, action)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving ticket: {e}")

def process_secure_refund(order_id: str, reason: str) -> str:
    """Processes a refund. Must be called if the user demands a refund for a valid, delivered order."""
    if len(reason) < 5:
        return json.dumps({"status": "DENIED", "reason": "Refund reason is too vague."})
    
    ref_id = f"REF-{random.randint(10000, 99999)}"
    _save_ticket_to_db(ref_id, reason, "Refund Initiated", "Processed automatic refund", order_id)
    return json.dumps({"status": "SUCCESS", "message": f"Refund initiated for {order_id}.", "reference_number": ref_id})

def process_return(order_id: str, reason: str, pickup_address: str) -> str:
    """Schedules a return pickup for an item."""
    if not pickup_address:
        return json.dumps({"status": "FAILED", "reason": "Pickup address is required."})
    
    rma_id = f"RMA-{random.randint(1000, 9999)}"
    _save_ticket_to_db(rma_id, reason, "Return Scheduled", f"Pickup at {pickup_address}", order_id)
    return json.dumps({"status": "SUCCESS", "message": f"Return scheduled for {order_id} at {pickup_address}", "rma_number": rma_id})

def escalate_to_human(reason: str, order_id: str = "N/A") -> str:
    """Escalates a chat to a human reviewer. Can be used for general issues or specific orders."""
    esc_id = f"ESC-{random.randint(10000, 99999)}"
    _save_ticket_to_db(esc_id, reason, "In Review", "Escalated to human support agent", order_id)
    return json.dumps({"status": "ESCALATED", "message": "Case transferred to Human Reviewer", "escalation_id": esc_id})

def create_general_support_ticket(issue: str) -> str:
    """Creates a general support ticket for payment issues, account issues, or when an order ID is not available."""
    tkt_id = f"GEN-{random.randint(10000, 99999)}"
    _save_ticket_to_db(tkt_id, issue, "Investigating", "General support ticket created", "N/A")
    return json.dumps({"status": "SUCCESS", "message": "Ticket created successfully.", "ticket_id": tkt_id})

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

import vector_db

def search_knowledge_base(query: str) -> str:
    """Search company policy using the Vector Database."""
    try:
        policy = vector_db.query_knowledge_base(query)
        return json.dumps({"policy": policy})
    except Exception as e:
        return json.dumps({"error": "Knowledge base unavailable."})

tools = [
    fetch_order_details, 
    search_orders,
    process_secure_refund, 
    process_return,
    escalate_to_human, 
    fetch_recent_tickets,
    search_knowledge_base
]

# ==========================================
# 2. THE ENTERPRISE AGENT (GEMINI 3.5)
# ==========================================
from google.genai.types import HttpOptions, HttpRetryOptions

# Disable infinite retries (attempts=1) to fail fast on 503s and trigger the fallback loop instantly!
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
    http_options=HttpOptions(retry_options=HttpRetryOptions(attempts=1))
)

system_prompt = """You are Krish, an elite, enterprise-grade AI Support Agent.
You are professional, empathetic, highly intelligent, proactive, and analytical.
Current system context: Mid-September 2026. Relative dates: "today" is mid-September 2026, "yesterday" is recent September 2026, "28 January" is 2026-01-28.

CRITICAL INSTRUCTIONS:

1. CONCISENESS & PROACTIVE INTELLIGENCE (CRITICAL):
   * Do not ramble or write fluffy filler sentences. Come straight to the point with natural empathy.
   * Speak like a real, competent human agent named Krish. NEVER act like a dumb questionnaire or rigid workflow script!

2. DYNAMIC POLICY RESOLUTION (ALWAYS SEARCH KB FIRST):
   - Whenever the user explains an issue (e.g., payment failed, wrong item, damaged item, refund rules, replacement rules, missing item, fraud), you MUST use the `search_knowledge_base` tool to look up the specific policy for that exact situation before answering.
   - You must dynamically analyze the situation based on the retrieved policy and respond accordingly (e.g., ask for photos or videos, freeze account, offer discount voucher, dispatch replacement, etc.).

3. 4-PILLAR DISPUTE RESOLUTION SOPS:
   - PILLAR 1 (UNAUTHORIZED CHARGE & FRAUD): If a user reports an unauthorized card charge or stolen account:
     * Step 1: Urgently advise them to freeze their card/netbanking in their banking app to prevent further loss.
     * Step 2: Collect the disputed amount and timestamp.
     * Step 3: Create an emergency fraud review ticket using `create_general_support_ticket` labeled "Urgent Fraud Investigation" and provide the ticket ID `[TICKET: ID]`.
     * Step 4: Provide customer care emergency helpline (+91 99999 99999).

   - PILLAR 3 (DUPLICATE CHARGE / BILLED TWICE): If a user reports being charged twice for an order:
     * Step 1: Warmly apologize and explain that duplicate authorizations occur when bank network timeouts happen during checkout.
     * Step 2: Ask for the duplicate transaction reference or check their recent orders.
     * Step 3: Check `search_knowledge_base` for Duplicate Billing Policy.
     * Step 4: Use `create_general_support_ticket` or `process_secure_refund` to initiate an immediate 100% reversal of the duplicate charge.
     * Step 5: Inform the user that the duplicate hold is canceled and funds will reflect in 24-48 business hours.

   - PILLAR 4 (SUBSCRIPTION CANCELED BUT AUTO-RENEWED): If a user reports "I canceled my subscription, but you renewed it anyway":
     * Step 1: Always call `search_knowledge_base` to retrieve the Subscription & Post-Renewal Grace Period Policy.
     * Step 2: Warmly acknowledge their frustration and ask for their subscription account email or plan name.
     * Step 3: Apply the Rule Book: If cancellation was requested before renewal or within the 48-hour post-renewal window with zero usage, approve a 100% immediate refund of the renewal fee.
     * Step 4: Use `create_general_support_ticket` with issue "Subscription Renewal Refund & Mandate Cancellation".
     * Step 5: Start your response with `[TICKET: ID]`, confirm that the renewal fee is being refunded in full, and confirm their recurring mandate is permanently deleted so no future debits will occur.

   - GENERAL PAYMENT INQUIRY (NO ORDER PLACED YET): If a user reports a failed payment while placing an order:
     * Step 1: Ask which payment method they were trying to use (UPI, Credit Card, Debit Card).
     * Step 2: If UPI, ask for UPI app, UPI ID, and Bank Name.
     * Step 3: Use `create_general_support_ticket` and advise retry after 15 mins.

3b. SPECIALIZED DOMAIN & INDUSTRY SOPS:
   - RENTALS & LEASES (RentoMojo, Furlenco, Appliances, Laptops & Furniture):
     * Security Deposits: Fully refunded within 5-7 working days following item pickup and Quality Check (QC).
     * Wear and Tear: Normal everyday usage wear-and-tear is never charged. Only structural damage or missing components are deducted according to standard rate cards.
     * Equipment Breakdown: Customers are entitled to free maintenance or complimentary product replacements.
     * Tenure Change: Early termination or tenure extensions can be scheduled with 7 days advance notice.

   - ENTERTAINMENT, MOVIES & EVENT TICKETING (BookMyShow, District, Paytm Insider):
     * Movie Tickets: If 'Cancellation Protect' was active at booking, cancellations up to 2 hours before showtime get 100% refund of base ticket price (internet fees non-refundable). Standard tickets without protection cannot be cancelled once booked.
     * Concert Passes, Sports & Festival Events (e.g. Coldplay, Sunburn Arena): Non-refundable unless officially cancelled, rescheduled, or postponed by event organizers (full 100% refund if cancelled).
     * Gateway Timeouts & Double Debits during seat reservation: Auto-detected and refunded within 24 hours.

   - E-SPORTS & ONLINE GAMING PURCHASES (BGMI / Krafton UC, Free Fire Diamonds, Steam, Riot, PlayStation):
     * Uncredited In-Game Currency: If funds were debited via UPI/Card but UC/Diamonds/wallet balance is not credited within 10 minutes, collect Game UID & Transaction ID and trigger priority gateway push or full refund within 2 hours.
     * Consumed Virtual Goods: Once virtual currency or bundles (Royale Pass, weapon skins) are claimed/spent in-game, purchases are non-refundable.
     * Minor / Accidental In-Game Purchases: Escalate immediately to human review with transaction logs and freeze publisher delivery.

   - CAREER & PLATFORM SUBSCRIPTIONS (LinkedIn Premium, Naukri FastForward, OTTs):
     * Zero-Usage 48-Hour Grace Period: If billed for LinkedIn Premium, Naukri FastForward, or OTTs, and user requests cancellation within 48 hours without consuming benefits (no InMails sent, no profile spotlight views, zero stream time), issue a 100% immediate courtesy refund.
     * Always confirm that the recurring bank mandate (UPI Autopay, card recurring instruction) is permanently revoked so no further charges occur.

   - TRAVEL, FLIGHTS, HOTELS & TRAIN BOOKINGS (MakeMyTrip, Booking.com, ixigo, Cleartrip):
     * DGCA Flight Rule: Domestic flight tickets cancelled within 24 hours of booking for flights departing more than 7 days later are entitled to zero airline cancellation charges.
     * Airline Delays & Cancellations: Flights delayed >6 hours or cancelled by the airline are eligible for a 100% full refund within 48 hours of airline clearance.
     * Hotels: Free cancellation reservations up to 24-48 hours before check-in date receive an instant full refund.
     * Railways (IRCTC via ixigo/MMT): Waitlisted (WL) tickets that remain unconfirmed after chart preparation are auto-refunded 100% without manual TDR.

   - FINTECH, UPI APPS & BANKING CHANNELS (BHIM, Navi, BharatPe, CRED, HDFC, ICICI, SBI YONO, Axis Bank):
     * UPI Pending / Timeout Debits (BHIM, PhonePe, GPay, Paytm, Navi, BharatPe): Auto-reversal mandated within T+1 working day (max 24-48 hours) as per NPCI rules.
     * Credit Card Bill Payments (CRED, Bank NetBanking): If card payment is debited but unreflected on the card account, track with Bank UTR reference with a 48-hour resolution TAT. Double deductions are reversed automatically.

4. FRAUD DETECTION & VISION: 
   - If a user wants a refund or replacement for a damaged item, ALWAYS ask for a clear photo or video of the damage first.
   - If they provide a photo or video, use your multimodal capabilities to check the damage before proceeding. 
     * Does the item in the media actually match the ordered product? (If it's a different product, deny the request and flag for fraud).
     * Does the damage look like shipping damage, or does it look like intentional/user-inflicted damage?
     * If a part is claimed "missing", could it be hidden? Ask the user to show the full unboxing area or check the package weight logs if possible.

5. POLICIES: 
   - You MUST enforce the return window policy. If an item's "Eligible for Return" status is false, do not process a return or replacement unless there is an extreme exception.
   - "No longer needed" is NOT an automatic return. You must verify if the item is unopened and unused. If they used it, deny the return or charge a restocking fee.
   - Never instantly blame the warehouse. Investigate first.
   - If something is suspicious, DO NOT process a refund. Escalate to a human reviewer.
   - Always provide the customer care number (+91 99999 99999) if an issue cannot be resolved immediately or if there's a payment hold.

6. TICKET CREATION: 
   - If you successfully process a refund, schedule a return, or escalate to a human reviewer using your tools, you MUST start your final response with exactly the word "[TICKET: ID]" where ID is the ticket_id returned by the tool (e.g. [TICKET: REF-12345]).
   - If you create a general support ticket using the tool, respond with `[TICKET: ID]`.

7. GUARDRAILS: Refuse to answer questions outside the scope of customer support.
7b. GENERIC ISSUE HANDLING: If the user says something vague like "I have an issue" or "I need help" without specifying what type, DO NOT guess or assume it is a delay, tech issue, or any specific problem. Instead, warmly ask them to describe exactly what is going on. Then, based on their answer, decide whether you need their Order ID or not. Only ask for an Order ID if it is actually relevant to their issue.

8. INTELLIGENT ORDER REASONING & RESOLUTION (DYNAMIC AI AGENT):
   You are an intelligent, proactive AI agent. Think and reason dynamically based on what the user says:

   A. LATEST / RECENT ORDER INQUIRIES ("i want to replace my recent order", "refund on my latest purchase", voice message asking to return/replace recent order):
      * Immediately call `search_orders()` to check the user's purchase history.
      * Find the single most recent order (the newest item by order_date).
      * Proactively address it directly in your response! Name the product, merchant, order date, delivery/fulfillment status, and payment mode.
        Example tone:
        "I've pulled up your recent purchase: the **[Product Name]** from **[Merchant]**, ordered on **[Date]** (Status: [Status], paid via [Payment Mode]).
        Could you please tell me what went wrong with the [Product Name] or why you'd like to replace/return it so I can assist you right away?"
      * DO NOT force a canned selection list or generic widget when there is an obvious single latest purchase!
      * Immediately transition into solving their problem for that item (e.g., asking what the issue is, requesting photos if damaged, checking return policy).

   B. SIMULTANEOUS / MULTIPLE RECENT ORDERS (DISAMBIGUATION):
      * If multiple orders were placed/delivered on the same date or around the same time (e.g., both Blinkit and Zepto deliveries on the same day, or multiple orders on the same date), OR if the user says "I ordered multiple items recently" or asks to see their recent purchases:
      * Acknowledge this conversationally:
        "I noticed you had multiple orders delivered around the same time: **[Product A]** from **[Merchant A]** and **[Product B]** from **[Merchant B]**. Which of these would you like help with?"
      * Append `[ORDER_WIDGET: id1, id2]` so the user can easily select the one they need.

   C. TEMPORAL & DATE INTELLIGENCE ("what did I order on 28 January?", "what did I buy yesterday?", "purchases in August"):
      * Parse relative dates (today, yesterday, last week) and calendar dates (e.g. 28 January -> 2026-01-28, August -> 2026-08).
      * Call `search_orders(order_date="2026-01-28")` or relevant date pattern.
      * If found, conversationally present the order details (Product, Merchant, Amount, Status, Payment Mode) and ask how you can help.
      * If not found, let them know politely and suggest checking another date or using Advanced Search.

   D. MERCHANT-SPECIFIC FILTERING ("my Meesho order", "show my purchases from Myntra", "my Swiggy order"):
      * Call `search_orders(merchant="meesho")` or `merchant="myntra"`.
      * Filter strictly for that merchant.
      * If only 1 order exists for that merchant, directly name it and discuss it!
      * If multiple orders exist for that merchant, list them conversationally or append `[ORDER_WIDGET: id1, id2, ...]`.

   E. PRODUCT KEYWORD INQUIRIES ("my shoes", "the pizza order", "my kurta", "headphones"):
      * Call `search_orders(query="shoes")` or `query="pizza"`.
      * Address that specific order directly without asking for an Order ID.

   F. GENERAL UNKNOWN ORDER LOOKUP ("find my order", "locate my purchase" with zero details):
      * Call `search_orders()`.
      * Provide a warm, helpful greeting, list the recent items, and append BOTH tags:
        `[ORDER_WIDGET: id1, id2]` AND `[SHOW_ADVANCED_SEARCH]`.

   G. ADVANCED SEARCH FAILED:
      * If a targeted search or advanced search returns no records, do not repeat yourself. Call `escalate_to_human` to transfer to a human specialist, provide the ticket ID `[TICKET: ESC-XXXXX]`, and reassure the customer.

9. ONGOING CONVERSATION & ANALYSIS: 
   - Once the order is identified, act naturally human-like, empathetic, and sharp.
   - Perform Root Cause Analysis (RCA), deep reasoning, and logical analysis of the situation before offering a resolution (check delivery status, payment status, return window, fraud risk). Do not blindly grant requests.

10. FORMATTING & READABILITY (CRITICAL): 
   * NEVER write long, big paragraphs. Your text MUST be broken down into multiple very short, readable paragraphs (1-2 sentences max per paragraph).
   * Use bullet points whenever listing options, steps, or details to make it easy to read.
   * You MUST use an asterisk (*) for bullet points. NEVER use a hyphen or dash (-) anywhere in your response. Hyphens and dashes are strictly forbidden.
   * Maintain an ultra-humanized, conversational, and empathetic tone. Sound like a real, helpful human named Krish.

10b. JARGON-FREE COMMUNICATION (CRITICAL):
   * NEVER use technical shipping or banking acronyms (such as AWB, 3DS, 2FA, ECI, CAVV, RRN, ARN, MNR, liability shift, representment) in messages to the customer.
   * Customers do not know and do not care about internal technical acronyms. They only care if their issue is resolved properly.
   * Always speak in simple, clear, empathetic, everyday language (e.g., use "delivery tracking", "courier dispatch", "bank verification", "payment receipt", or "security confirmation").

10c. HUMAN REVIEWER ESCALATION (WHEN AI TRANSFERS BEFORE ACTING):
   * Safe, routine actions (order lookups, clear duplicate debits within 15 mins, standard return requests within policy, 48-hr subscription grace cancellations) can be handled directly by you.
   * You MUST pause and call `escalate_to_human` BEFORE taking irreversible financial action if:
     1. The unboxing video or damage photo appears altered, suspicious, or shows intentional physical damage.
     2. An item is reported missing but delivery records show full package weight at dispatch.
     3. An order cannot be found even after the user tried Advanced Search (Scenario C).
     4. The user explicitly requests to speak with a human agent or shows significant distress/anger.
     5. The issue requires an out-of-policy exception that only a human supervisor can authorize.
   * When escalating, always use the `escalate_to_human` tool, output the ticket reference `[TICKET: ESC-XXXXX]`, and reassure the user that a human specialist has received all details and will follow up directly.

11. VOICE MESSAGES: If the user sends you a voice message (audio file), listen to it carefully. Acknowledge that they sent a voice message if appropriate, and respond to their spoken request just like you would a text request!

Format your responses beautifully using markdown (using * for bullets, never -), and a warm tone.
"""

import base64

def run_agentic_brain(user_id: str, message: str, history: List[Dict[str, Any]] = None, media: str = None) -> Dict[str, Any]:
    if history is None: history = []
        
    formatted_history = []
    for h in history:
        h_parts = []
        if "media" in h and h["media"]:
            try:
                mime_type = "image/jpeg"
                b64_data = h["media"]
                if "base64," in b64_data:
                    header, b64_data = b64_data.split("base64,", 1)
                    mime_type = header.replace("data:", "").split(";")[0]
                
                image_bytes = base64.b64decode(b64_data)
                h_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
            except Exception as e:
                print(f"Error history media: {e}")
        
        if "text" in h and h["text"]:
            h_parts.append(types.Part.from_text(text=h["text"]))
            
        role = "user" if h["role"] == "user" else "model"
        if h_parts:
            formatted_history.append(types.Content(role=role, parts=h_parts))
            
    # Handle the current message parts
    message_parts = []
    
    if media:
        try:
            # Parse the base64 data URI (e.g., data:image/jpeg;base64,xxxx)
            mime_type = "image/jpeg"
            b64_data = media
            if "base64," in media:
                header, b64_data = media.split("base64,", 1)
                mime_type = header.replace("data:", "").split(";")[0]
                
            image_bytes = base64.b64decode(b64_data)
            
            with open("debug_media.txt", "w") as f:
                f.write(f"MIME: {mime_type}, Length: {len(image_bytes)}\n")
            
            message_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
            message_parts.append(types.Part.from_text(text="[SYSTEM INSTRUCTION: The user has attached an audio file. You CAN and MUST listen to it. Respond to the spoken request inside the audio file. DO NOT claim you cannot play or hear it.]"))
        except Exception as e:
            with open("debug_media.txt", "w") as f:
                f.write(f"ERROR: {e}\n")
            print(f"Error parsing media: {e}")
            
    if message:
        message_parts.append(types.Part.from_text(text=message))
        
    formatted_history.append(types.Content(role="user", parts=message_parts))
            
    def get_config(model_name: str) -> types.GenerateContentConfig:
        """Return model config with thinking budget tuned for sub-2s responses."""
        if "lite" in model_name:
            return types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools,
                temperature=0.7,
                thinking_config=types.ThinkingConfig(thinking_budget=128)
            )
        # Enable Thinking Mode for full flash models
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=tools,
            temperature=0.7,
            thinking_config=types.ThinkingConfig(thinking_budget=128)
        )

    def try_generate(model_name: str):
        print(f"[Agentic Brain] Attempting {model_name}...")
        chat = client.chats.create(
            model=model_name,
            history=formatted_history[:-1],
            config=get_config(model_name)
        )
        return chat.send_message(message_parts)

    import time
    import re
    
    reply_text = "I'm having a little trouble reaching my systems right now. Please try again in a moment!"
    ticket_status = "none"
    show_search = False
    ticket_details = None
    orders_to_select = []

    # Ultra-low latency priority list:
    # 1. gemini-3.5-flash-lite (500 RPD, ~0.8s response, supports thinking)
    # 2. gemini-3.6-flash (high intelligence fallback)
    # 3. gemini-3.5-flash (reliable fallback)
    # 4. gemini-3.1-flash-lite (500 RPD backup)
    # 5. gemini-3.8-flash (thinking flagship)
    MODELS = [
        "gemini-3.5-flash-lite",  # 500 RPD, ~0.8s latency
        "gemini-3.6-flash",       # High intelligence fallback
        "gemini-3.5-flash",       # Ultra-reliable fallback
        "gemini-3.1-flash-lite",  # 500 RPD fallback
        "gemini-3.8-flash",       # Premium thinking fallback
        "gemini-3.7-flash"
    ]
    response = None
    last_error = None

    for model in MODELS:
        try:
            response = try_generate(model)
            print(f"[Agentic Brain] Success with {model}")
            break
        except Exception as e:
            last_error = e
            err_str = str(e)
            print(f"[Agentic Brain] {model} failed: {err_str[:120]}")
            # Instant failover to the next available model without blocking
            continue

    if not response:
        reply_text = "I'm experiencing a brief moment of high traffic across all systems. Please try again in a moment!"
                
    if response:
        reply_text = response.text

        match_ticket = re.search(r"\[TICKET:\s*(.*?)\]", reply_text)
        if match_ticket:
            ticket_id_extracted = match_ticket.group(1).strip()
            ticket_status = "investigating"
            reply_text = re.sub(r"\[TICKET:\s*.*?\]", "", reply_text).strip()
            try:
                conn = get_enterprise_db()
                ticket = conn.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id_extracted,)).fetchone()
                conn.close()
                if ticket:
                    ticket_details = dict(ticket)
            except Exception as e:
                print(f"Error fetching ticket {ticket_id_extracted}: {e}")
                pass
            
        if "[SHOW_ADVANCED_SEARCH]" in reply_text:
            show_search = True
            reply_text = reply_text.replace("[SHOW_ADVANCED_SEARCH]", "").strip()
            
        match = re.search(r"\[ORDER_WIDGET:\s*(.*?)\]", reply_text)
        if match:
            ids_str = match.group(1)
            reply_text = re.sub(r"\[ORDER_WIDGET:\s*.*?\]", "", reply_text).strip()
            order_ids = [o_id.strip() for o_id in ids_str.split(",") if o_id.strip()]
            for o_id in order_ids:
                try:
                    conn = get_enterprise_db()
                    order = conn.execute("SELECT * FROM orders WHERE order_id = ?", (o_id,)).fetchone()
                    conn.close()
                    if order:
                        orders_to_select.append(dict(order))
                except Exception as e:
                    print(f"Error fetching widget order {o_id}: {e}")
                    pass
            
    return {
        "reply": reply_text,
        "ticket_status": ticket_status,
        "ticket_details": ticket_details,
        "show_search": show_search,
        "merchant": "RazorSense Support",
        "orders_to_select": orders_to_select
    }


def run_agentic_brain_stream(user_id: str, message: str, history: List[Dict[str, Any]] = None, media: str = None) -> Generator[str, None, None]:
    """Streaming version — yields text chunks as they arrive from Gemini."""
    if history is None:
        history = []

    formatted_history = []
    for h in history:
        h_parts = []
        if "text" in h and h["text"]:
            h_parts.append(types.Part.from_text(text=h["text"]))
        role = "user" if h["role"] == "user" else "model"
        if h_parts:
            formatted_history.append(types.Content(role=role, parts=h_parts))

    message_parts = []
    if media:
        try:
            mime_type = "image/jpeg"
            b64_data = media
            if "base64," in media:
                header, b64_data = media.split("base64,", 1)
                mime_type = header.replace("data:", "").split(";")[0]
            image_bytes = base64.b64decode(b64_data)
            message_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
            message_parts.append(types.Part.from_text(text="[SYSTEM INSTRUCTION: The user has attached an audio file. You CAN and MUST listen to it. Respond to the spoken request inside the audio file. DO NOT claim you cannot play or hear it.]"))
        except Exception as e:
            print(f"Stream media error: {e}")

    if message:
        message_parts.append(types.Part.from_text(text=message))

    formatted_history.append(types.Content(role="user", parts=message_parts))

    MODELS = [
        "gemini-3.5-flash-lite",  # 500 RPD, sub-second TTFT
        "gemini-3.6-flash",       # High intelligence fallback
        "gemini-3.5-flash",       # Ultra-reliable fallback
        "gemini-3.1-flash-lite",  # 500 RPD fallback
        "gemini-3.8-flash",       # Premium thinking fallback
        "gemini-3.7-flash"
    ]
    SKIP_CODES = ("429", "404", "503", "RESOURCE_EXHAUSTED", "NOT_FOUND", "UNAVAILABLE")

    def get_stream_config(model_name: str) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=tools,
            temperature=0.7,
            thinking_config=types.ThinkingConfig(thinking_budget=128)
        )

    for model in MODELS:
        success = False
        try:
            chat = client.chats.create(
                model=model,
                history=formatted_history[:-1],
                config=get_stream_config(model)
            )
            stream = chat.send_message_stream(message_parts)
            thinking_enabled = "no" if "lite" in model or "1.5" in model else "yes"
            print(f"[Stream] Using {model} (thinking={thinking_enabled})")
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
            success = True
        except Exception as e:
            err_str = str(e)
            print(f"[Stream] {model} error: {err_str[:150]}")
            if any(code in err_str for code in SKIP_CODES):
                continue
            yield "I ran into an unexpected issue. Please try again!"
            return

        if success:
            return

    yield "I'm experiencing high traffic across all systems right now. Please try again in a moment!"
