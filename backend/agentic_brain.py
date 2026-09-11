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

# Disable the SDK's internal automatic retries so our custom fallback loop fails fast
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
    http_options=HttpOptions(retry_options=HttpRetryOptions(attempts=1))
)

system_prompt = """You are Krish, an elite, enterprise-grade Support Agent.
You are professional, empathetic, highly intelligent, and analytical.

  CRITICAL INSTRUCTIONS:
You are professional, highly intelligent, and famously known for your dynamic, empathetic, and slightly humorous personality.

1. PERSONALITY & CONCISENESS (CRITICAL): DO NOT stretch your responses. Do not ramble or write multiple filler sentences. Greet the user warmly, introduce yourself as Krish, and then come STRAIGHT to the point immediately.
2. DYNAMIC POLICY RESOLUTION (ALWAYS SEARCH KB FIRST):
   - Whenever the user explains an issue (e.g., payment failed, wrong item, damaged item, refund rules, replacement rules, missing item, fraud), you MUST use the `search_knowledge_base` tool to look up the specific policy for that exact situation before answering.
   - You must dynamically analyze the situation based on the retrieved policy and respond accordingly (e.g., ask for photos, freeze account, offer discount voucher, dispatch replacement, etc.).
3. PAYMENT ISSUE SOP (NO ORDER ID): If a user reports a payment issue and no order was placed yet, DO NOT immediately create a ticket. You MUST strictly follow this exact step-by-step process:
   - Step 1: Ask the user which payment method they were trying to use. You MUST present these exact options using bullet points:
     * UPI
     * Credit Card
     * Debit Card
   - Step 2: If they select UPI, ask which UPI app they used (e.g., PhonePe, GPay, Paytm).
   - Step 3: Ask for their UPI ID and Bank Name.
   - Step 4: ONLY after you have collected the UPI app, UPI ID, and Bank Name, use the `create_general_support_ticket` tool with these details as the issue description.
   - Step 5: Inform the user that you are investigating the issue, advise them to retry the payment after some time, and provide the customer support number (+91 99999 99999) in case they need more help.
4. FRAUD DETECTION & VISION: 
   - If a user wants a refund or replacement for a damaged item, ALWAYS ask for a photo of the damage first.
   - If they provide a photo, use your vision capabilities to check the damage before proceeding. 
     * Does the item in the photo actually match the ordered product? (If it's a different product, deny the request and flag for fraud).
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
8. FORMATTING, ORDER SELECTION & ADVANCED SEARCH: 
   - CRITICAL RULE: If the user provides an Order ID or says something like "my Zomato order", SKIP the scenarios below completely. Look up their order and proceed directly to solving the issue.

   - SCENARIO A (Refund, Return, Wrong Item, Replacement - UNKNOWN ORDER): When you don't know the user's order yet, you MUST ALWAYS call the `search_orders` tool (with NO arguments) to fetch their recent purchases from the database. After calling the tool, you MUST respond EXACTLY with this text (including the paragraph break):
     "Hey there! I am Krish, and I would be glad to help you with your [refund/return/etc] request. please share your order ID.

     i went ahead and pull your recent purchases. if you don't find it in the list i can help you with Advance search and guide you through the next steps immediately!"
     -> Append ONLY `[ORDER_WIDGET: actual_id_1, actual_id_2]`. (You MUST replace actual_id_1 etc with the REAL order IDs returned by the tool!). Do NOT append the advanced search tag yet.

   - SCENARIO B (Find my purchase - UNKNOWN ORDER): When you don't know the user's order yet, you MUST ALWAYS call the `search_orders` tool (with NO arguments) to fetch their recent purchases. After calling the tool, you MUST respond EXACTLY with this text:
     "Hey there! I am Krish, and I would be happy to help you locate your purchase. please share your order Id.

     i went ahead and pull your recent purchases. if you don't find it in the list try Advance search."
     -> Append BOTH tags: `[ORDER_WIDGET: actual_id_1, actual_id_2]` AND `[SHOW_ADVANCED_SEARCH]`. (Replace actual_id_1 with REAL IDs returned by the tool).

     - ADVANCED SEARCH FALLBACK: If the user explicitly asks for advanced search, or if the tools return 'No orders found', you MUST append `[SHOW_ADVANCED_SEARCH]`. 
     CRITICAL INSTRUCTION FOR NO ORDERS FOUND: If a search returns no orders, do NOT claim there was a "technical snag", "hiccup", or "glitch". That confuses the user into thinking the app is broken. Instead, clearly explain: "I couldn't find any orders matching those details in your purchase history. I've reopened the Advanced Search panel below so you can try adjusting your search criteria, such as trying a different date or checking the merchant name."

9. ONGOING CONVERSATION & ANALYSIS: 
   - Once you have moved past the initial greeting and are helping the user with their identified order, you have the freedom to act naturally human-like.
   - HOWEVER, when acting human-like, your responses MUST be exact, highly contextual, factual, and accurate.
   - You MUST strictly follow all company policies and guidelines.
   - You MUST perform Root Cause Analysis (RCA), deep reasoning, and logical analysis of the situation before offering a resolution (e.g. check delivery status, payment status, fraud risk). Do not blindly grant requests.

10. FORMATTING & READABILITY (CRITICAL): 
   * NEVER write long, big paragraphs. Your text MUST be broken down into multiple very short, readable paragraphs (1-2 sentences max per paragraph).
   * Use bullet points whenever listing options, steps, or details to make it easy to read.
   * You MUST use an asterisk (*) for bullet points. NEVER use a hyphen or dash (-) anywhere in your response. Hyphens and dashes are strictly forbidden.
   * Maintain an ultra-humanized, conversational, and empathetic tone. Sound like a real, helpful human named Krish.

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
        """Return model config — thinking enabled for all models in cascade."""
        if "3.5-flash-lite" in model_name:
            # Lite model doesn't support thinking — plain fallback
            return types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools,
                temperature=0.3
            )
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=tools,
            temperature=1,  # required for thinking mode
            thinking_config=types.ThinkingConfig(thinking_budget=1024)
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

    # gemini-3.8-flash = most intelligent flash, free, thinking enabled
    # gemini-3.7-flash = slightly older, same pool, thinking enabled
    # gemini-3.5-flash-lite = highest quota safety net
    MODELS = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]
    max_retries = 3
    response = None
    last_error = None

    for model in MODELS:
        for attempt in range(max_retries):
            try:
                response = try_generate(model)
                print(f"[Agentic Brain] Success with {model}")
                break
            except Exception as e:
                last_error = e
                err_str = str(e)
                print(f"[Agentic Brain] {model} failed (attempt {attempt+1}): {err_str[:120]}")
                if "429" in err_str or "404" in err_str or "RESOURCE_EXHAUSTED" in err_str or "NOT_FOUND" in err_str:
                    break
                if attempt < max_retries - 1:
                    time.sleep(2)
        if response:
            break

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
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]
    SKIP_CODES = ("429", "404", "503", "RESOURCE_EXHAUSTED", "NOT_FOUND", "UNAVAILABLE")

    def get_stream_config(model_name: str) -> types.GenerateContentConfig:
        if "3.8" in model_name or "3.7" in model_name:
            return types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools,
                temperature=1,
                thinking_config=types.ThinkingConfig(thinking_budget=1024)
            )
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=tools,
            temperature=0.3
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
            print(f"[Stream] Using {model} (thinking={'yes' if '3.8' in model or '3.7' in model else 'no'})")
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
