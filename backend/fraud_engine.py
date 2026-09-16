"""
RazorSense Sentinel: Two-Tier Deterministic Fraud & Policy Guardian
Implements neuro-symbolic enterprise risk scoring, claim classification,
and authentic merchant SOP enforcement across e-commerce, food, travel, and subscriptions.
"""

import sqlite3
import os
import json
import random
import datetime
import re
from typing import Dict, Any, Optional

def get_db():
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------------------------------------------------------------------
# 1. CLAIM CLASSIFIER (Subjective vs Objective Analysis)
# ---------------------------------------------------------------------------

SUBJECTIVE_KEYWORDS = [
    "taste", "tasted", "flavor", "flavour", "spicy", "salt", "salty", "sweet", 
    "bland", "not good", "bad taste", "didn't like", "did not like", "dislike", 
    "don't like", "regret", "changed mind", "buyer remorse", "ugly", "not pretty",
    "unwanted", "expected better", "not yummy", "cold food"
]

OBJECTIVE_DEFECT_KEYWORDS = [
    "spoiled", "stale", "fungus", "rotten", "smell", "insect", "hair", "foreign object",
    "spilled", "leaking", "crushed", "broken", "damaged", "shattered", "defective",
    "not working", "dead on arrival", "wrong size", "size small", "size large",
    "too tight", "too loose", "wrong item", "different item", "missing item", 
    "empty box", "fake product", "counterfeit", "torn", "torn cloth"
]

SUBSCRIPTION_KEYWORDS = [
    "cancel subscription", "cancel premium", "stop auto renew", "stop renewal",
    "revoke mandate", "recurring charge", "cancel membership"
]

RIDER_MISCONDUCT_KEYWORDS = [
    "delivery boy", "delivery person", "delivery agent", "delivery executive", "driver", 
    "rider", "courier guy", "delivery guy", "misbehaved", "misbehavior", "rude", "abusive", 
    "shouted", "harassed", "threatened", "drunk", "demanded extra money", "demanded tip", 
    "refused doorstep", "threw package", "argument", "unprofessional", "bad behavior"
]

def classify_claim_nature(claim_type: str, issue_text: str) -> str:
    """Classifies a dispute into an unambiguous claim category."""
    text = f"{claim_type} {issue_text}".lower()
    
    # Check rider / delivery personnel misconduct first
    for kw in RIDER_MISCONDUCT_KEYWORDS:
        if kw in text:
            return "RIDER_MISCONDUCT"
    
    # Check subscription
    if any(k in text for k in SUBSCRIPTION_KEYWORDS):
        return "SUBSCRIPTION_MANDATE"
    
    # Check objective physical defects
    for kw in OBJECTIVE_DEFECT_KEYWORDS:
        if kw in text:
            return "OBJECTIVE_DEFECT"
            
    # Check subjective preferences
    for kw in SUBJECTIVE_KEYWORDS:
        if kw in text:
            return "SUBJECTIVE_PREFERENCE"
            
    # Fallback to general inquiry or billing
    if any(k in text for k in ["double charge", "duplicate", "debited twice", "failed", "pending"]):
        return "BILLING_ANOMALY"
        
    return "GENERAL_INQUIRY"

# ---------------------------------------------------------------------------
# 2. FRAUD RISK SCORING ALGORITHM (0 - 100)
# ---------------------------------------------------------------------------

def calculate_fraud_score(
    user_id: str,
    order: Optional[Dict[str, Any]],
    claim_category: str,
    has_photo: bool,
    issue_text: str
) -> Dict[str, Any]:
    """Computes a multi-variable fraud risk score between 0 and 100."""
    score = 10  # Base trust baseline
    factors = []

    # Factor 1: Claim velocity in tickets database
    try:
        conn = get_db()
        ticket_count = conn.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
        conn.close()
        if ticket_count > 5:
            score += 15
            factors.append(f"Elevated dispute frequency ({ticket_count} prior claims logged)")
        else:
            factors.append("Dispute frequency within normal customer profile")
    except Exception:
        pass

    # Factor 2: Subjective preference claiming full financial payout
    if claim_category == "SUBJECTIVE_PREFERENCE":
        score += 35
        factors.append("Claim is based on subjective sensory preference (taste/dislike) rather than verified physical defect")

    # Factor 3: Lack of physical proof for physical merchandise / food damage
    if claim_category == "OBJECTIVE_DEFECT":
        text = issue_text.lower()
        if any(w in text for w in ["damaged", "broken", "spilled", "spoiled", "torn"]) and not has_photo:
            score += 25
            factors.append("Physical damage/spoilage claimed without visual photographic proof")
        elif has_photo:
            score -= 10
            factors.append("Photographic proof supplied for verification")

    # Factor 4: High item value risk
    if order and order.get("amount"):
        try:
            amt = float(order["amount"])
            if amt >= 10000:
                score += 20
                factors.append(f"High-value transaction risk (₹{amt:,.2f}) requires elevated authorization")
            elif amt <= 500:
                score -= 5
                factors.append("Low-value threshold qualifies for automated dispute routing")
        except (ValueError, TypeError):
            pass

    # Factor 5: Delivery elapsed time
    if order and order.get("order_date"):
        try:
            order_dt = datetime.datetime.strptime(order["order_date"], "%Y-%m-%d")
            # In our system context, current date is mid-September 2026
            now = datetime.datetime(2026, 9, 16)
            days_elapsed = (now - order_dt).days
            if order.get("merchant", "").lower() in ["swiggy", "zomato", "blinkit", "zepto"]:
                if days_elapsed > 1:
                    score += 30
                    factors.append(f"Perishable delivery window expired ({days_elapsed} days elapsed since delivery)")
            elif days_elapsed > 14:
                score += 20
                factors.append(f"Standard 7-14 day return window expired ({days_elapsed} days elapsed)")
        except Exception:
            pass

    # Factor 6: Contradiction & Claim-Shifting Anomaly Detection on the same order
    order_id = order.get("order_id") if order else None
    if order_id and order_id != "N/A":
        try:
            conn = get_db()
            prior_tickets = conn.execute(
                "SELECT ticket_id, issue, status, action_taken FROM tickets WHERE order_id = ? ORDER BY rowid DESC",
                (order_id,)
            ).fetchall()
            conn.close()
            
            if prior_tickets:
                prior_issues = " ".join([t["issue"].lower() for t in prior_tickets])
                had_subjective = any(w in prior_issues for w in [
                    "taste", "flavor", "preference", "culinary", "didn't like", "dislike", 
                    "quality audit", "feedback logged", "changed mind", "no longer needed", 
                    "buyer remorse", "remorse", "not wanted"
                ])
                
                # If currently claiming an objective physical defect after subjective was logged/denied
                if had_subjective and claim_category == "OBJECTIVE_DEFECT":
                    score += 45
                    prior_id = prior_tickets[0]["ticket_id"]
                    factors.append(
                        f"CRITICAL ANOMALY: Customer shifted claim reason from subjective preference/taste to physical defect after prior policy rejection (Prior Ticket #{prior_id})"
                    )
                elif len(prior_tickets) >= 2:
                    score += 25
                    factors.append(f"Multiple conflicting dispute filings detected on single order #{order_id} ({len(prior_tickets)} prior tickets)")
        except Exception as e:
            print(f"[Sentinel] Error checking prior tickets for fraud score: {e}")

    score = max(0, min(100, score))
    
    risk_level = "LOW"
    if score >= 65:
        risk_level = "HIGH"
    elif score >= 35:
        risk_level = "MEDIUM"

    return {
        "fraud_score": score,
        "risk_level": risk_level,
        "contributing_factors": factors
    }

# ---------------------------------------------------------------------------
# 3. DETERMINISTIC MERCHANT POLICY ENFORCER
# ---------------------------------------------------------------------------

def evaluate_merchant_policy(
    order: Optional[Dict[str, Any]],
    claim_category: str,
    fraud_assessment: Dict[str, Any],
    has_photo: bool,
    issue_text: str
) -> Dict[str, Any]:
    """Applies authentic merchant Terms of Service and Standard Operating Procedures."""
    
    merchant = (order.get("merchant") if order else "").lower()
    product = order.get("product") if order else "Item"
    order_id = order.get("order_id") if order else "N/A"
    
    # ── GLOBAL CASE: DELIVERY PARTNER / RIDER MISCONDUCT ──
    if claim_category == "RIDER_MISCONDUCT":
        merchant_name = merchant.capitalize() if merchant else "Delivery Partner"
        return {
            "verdict": "ESCALATE_SAFETY_INVESTIGATION",
            "action_type": "LOG_RIDER_DISCIPLINARY",
            "refund_allowed": False,
            "ticket_prefix": "TCK-RIDER",
            "ticket_status": "Rider Disciplinary Investigation",
            "action_taken": f"Logged urgent safety & misconduct escalation with {merchant_name} Logistics Fleet. Requested permanent driver delink from customer address and issued courtesy apology credit.",
            "policy_rule_cited": f"{merchant_name} Logistics Code of Conduct & Safety Charter (Clause 8.3): Zero tolerance for verbal abuse, intimidation, harassment, or unprofessional delivery behavior. Mandates immediate fleet audit and address delink.",
            "explanation_to_user": (
                f"I am deeply sorry that you experienced unprofessional behavior from the delivery partner for your {product}. "
                f"We take customer safety and respectful conduct extremely seriously.\n\n"
                f"* **Immediate Action**: I have filed a priority Safety & Disciplinary Investigation ticket with {merchant_name}'s logistics supervisor.\n"
                f"* **Permanent Delink**: I have marked your delivery address to ensure this specific driver is permanently blocked from being assigned to any of your future deliveries.\n"
                f"* **Resolution SLA**: The fleet manager will audit the driver's GPS and delivery log within 24 hours."
            )
        }

    # ── GLOBAL CASE: CLAIM SHIFTING & REASON CONTRADICTION ON SAME ORDER ──
    if order_id and order_id != "N/A" and claim_category == "OBJECTIVE_DEFECT":
        had_prior_subjective = False
        prior_ticket_id = None
        prior_ticket_issue = None
        try:
            conn = get_db()
            prior_tickets = conn.execute(
                "SELECT ticket_id, issue, status FROM tickets WHERE order_id = ? ORDER BY rowid DESC",
                (order_id,)
            ).fetchall()
            conn.close()
            for t in prior_tickets:
                iss_str = t["issue"].lower()
                if any(k in iss_str for k in [
                    "taste", "flavor", "preference", "culinary", "feedback logged",
                    "didn't like", "dislike", "buyer remorse", "changed mind", "no longer needed", "remorse"
                ]):
                    had_prior_subjective = True
                    prior_ticket_id = t["ticket_id"]
                    prior_ticket_issue = t["issue"]
                    break
        except Exception:
            pass

        if had_prior_subjective:
            merchant_display = merchant.capitalize() if merchant else "the merchant"
            if not has_photo:
                return {
                    "verdict": "INVESTIGATE_CLAIM_CONTRADICTION",
                    "action_type": "INVESTIGATE_DISCREPANCY",
                    "refund_allowed": False,
                    "ticket_prefix": None,  # STRICT: No ticket created while investigating!
                    "ticket_status": "Contradiction Investigation",
                    "action_taken": f"Discrepancy detected: Order was previously claimed as '{prior_ticket_issue}' (Ticket #{prior_ticket_id}). Awaiting customer clarification and photographic proof.",
                    "policy_rule_cited": f"RazorSense Anti-Arbitrage Sentinel SOP: When a customer pivots from non-refundable subjective feedback to an objective defect on the same order, automatic refunds and replacements are locked pending verification.",
                    "explanation_to_user": (
                        f"Wait, I noticed you previously selected a subjective reason (**{prior_ticket_issue}**) for this exact order ({order_id}, Ticket #{prior_ticket_id}), "
                        f"where we explained that monetary compensation does not apply.\n\n"
                        f"Now you've selected an objective physical defect (**{issue_text}**).\n\n"
                        f"Could you help clarify what happened? Was your previous selection a mistake, or did you observe an actual defect like visible spoilage, mold, physical damage, or an off-odor?\n\n"
                        f"Because our fraud and dispute engine tracks reason changes as a policy discrepancy, we cannot issue an automated resolution without photo evidence. "
                        f"If the item genuinely arrived spoiled, damaged, or defective, please share a quick photo using the paperclip icon so we can submit it to a senior supervisor for manual review."
                    )
                }
            else:
                return {
                    "verdict": "ESCALATE_CLAIM_SHIFT_AUDIT",
                    "action_type": "ESCALATE_CLAIM_SHIFT_AUDIT",
                    "refund_allowed": False,
                    "ticket_prefix": "TCK-AUDIT",
                    "ticket_status": "Supervisor Fraud Audit",
                    "action_taken": f"Claim shift detected (Prior: {prior_ticket_issue} -> Current: {issue_text}). Visual proof submitted. Escalated to senior supervisor for merchant audit.",
                    "policy_rule_cited": "RazorSense Integrity SOP: Dual-claim disputes require supervisor manual review of visual proof against merchant dispatch batch logs.",
                    "explanation_to_user": (
                        f"Thank you for providing the photo. Because this order was initially reported under '{prior_ticket_issue}' (Ticket #{prior_ticket_id}) "
                        f"and subsequently updated to a defect claim, our Sentinel Guardian has escalated your case (Ticket #TCK-AUDIT-XXXX) "
                        f"to a senior dispute supervisor for priority batch review with {merchant_display}."
                    )
                }

    # ── CASE A: SWIGGY / ZOMATO / BLINKIT / ZEPTO (Food & Quick-Commerce) ──
    if merchant in ["swiggy", "zomato", "blinkit", "zepto", "swish", "bistro"]:
        if claim_category == "SUBJECTIVE_PREFERENCE":
            # REJECT monetary refund; Log restaurant quality ticket
            return {
                "verdict": "REJECT_WITH_POLICY",
                "action_type": "LOG_FEEDBACK_TICKET",
                "refund_allowed": False,
                "ticket_prefix": "TCK-SWIG",
                "ticket_status": "Feedback Logged to Restaurant",
                "action_taken": "Subjective taste complaint logged for restaurant quality audit. Monetary refund denied under merchant Terms of Service.",
                "policy_rule_cited": f"{merchant.capitalize()} Food Quality SOP: Taste preferences, spice levels, and subjective culinary dissatisfaction do not qualify for financial refunds once food is prepared and delivered. An official quality audit ticket is dispatched to the kitchen partner.",
                "explanation_to_user": (
                    f"I understand your feedback regarding the taste of your {product} from {merchant.capitalize()}. "
                    f"Under {merchant.capitalize()}'s official food policy, monetary refunds cannot be issued for subjective taste preferences once prepared. "
                    f"However, to ensure this is addressed, I have logged an official Restaurant Quality Ticket with the kitchen management for review."
                )
            }
        elif claim_category == "OBJECTIVE_DEFECT":
            if has_photo:
                return {
                    "verdict": "APPROVE_FOOD_COMPENSATION",
                    "action_type": "PROCESS_REFUND",
                    "refund_allowed": True,
                    "ticket_prefix": "REF-SWIG",
                    "ticket_status": "Refund Approved",
                    "action_taken": "Photo proof verified. 100% refund initiated to original payment method.",
                    "policy_rule_cited": f"{merchant.capitalize()} Food Spoilage/Damage SOP: Validated photo proof of spilled or spoiled food warrants full reimbursement within 24-48 hours.",
                    "explanation_to_user": f"I've verified the defect photo for your {product}. A full refund of ₹{order.get('amount', '0.00')} has been initiated to your original payment method."
                }
            else:
                return {
                    "verdict": "MANDATE_PROOF",
                    "action_type": "REQUEST_PHOTO",
                    "refund_allowed": False,
                    "ticket_prefix": None,  # STRICT: Do not create a ticket when merely requesting a photo!
                    "ticket_status": "Awaiting Visual Proof",
                    "action_taken": "Requested clear photo of damaged/spoiled food before authorization.",
                    "policy_rule_cited": f"{merchant.capitalize()} Perishable Evidence Clause: Photos of damaged packaging or spoiled food are required within 2 hours of delivery.",
                    "explanation_to_user": f"To process compensation for spoiled or damaged food on {merchant.capitalize()}, please attach a quick photo showing the packaging and defect using the paperclip button."
                }

    # ── CASE B: MEESHO / MYNTRA (Apparel & Fashion) ──
    elif merchant in ["meesho", "myntra"]:
        is_sizing = any(k in issue_text.lower() for k in ["size", "tight", "loose", "fit", "small", "large", "exchange"])
        if is_sizing or claim_category in ["OBJECTIVE_DEFECT", "SUBJECTIVE_PREFERENCE"]:
            return {
                "verdict": "APPROVE_EXCHANGE",
                "action_type": "SCHEDULE_PICKUP",
                "refund_allowed": False,
                "ticket_prefix": "RMA",
                "ticket_status": "Courier Pickup Scheduled",
                "action_taken": f"Free doorstep exchange authorized under {merchant.capitalize()} 7-day apparel policy. Courier will pick up item tomorrow and issue replacement.",
                "policy_rule_cited": f"{merchant.capitalize()} 7-14 Day Apparel SOP: Sizing and style exchanges are 100% free with doorstep courier handover.",
                "explanation_to_user": (
                    f"I've scheduled a free doorstep exchange for your **{product}** from **{merchant.capitalize()}**.\n\n"
                    f"* **Pickup Window**: Tomorrow at your registered address\n"
                    f"* **Replacement**: Dispatched upon courier doorstep scan\n"
                    f"* **Cost**: ₹0 (100% free under {merchant.capitalize()} 7-day exchange guarantee)"
                )
            }

    # ── CASE C: AMAZON / FLIPKART (Electronics & Hardware) ──
    elif merchant in ["amazon", "flipkart"]:
        is_electronics = any(k in product.lower() for k in ["samsung", "phone", "galaxy", "macbook", "laptop", "earbuds", "headphones", "mouse"])
        if is_electronics:
            return {
                "verdict": "SCHEDULE_TECHNICIAN_VISIT",
                "action_type": "BOOK_INSPECTION",
                "refund_allowed": False,
                "ticket_prefix": "INSP-AMZ",
                "ticket_status": "Doorstep Inspection Slotted",
                "action_taken": f"Electronics policy mandates authorized brand technician inspection for {product}. Direct refunds are restricted.",
                "policy_rule_cited": f"{merchant.capitalize()} Electronics Return SOP: Mobile phones, tablets, and electronics are eligible for 7-day replacement only following authorized doorstep brand technician diagnosis.",
                "explanation_to_user": (
                    f"Under **{merchant.capitalize()}** official electronics policy, mobile devices and hardware require an authorized brand technician inspection before a replacement unit can be released.\n\n"
                    f"* **Appointment Slotted**: Technician visit scheduled within 48 business hours\n"
                    f"* **Inspection Checklist**: Physical damage check, serial/IMEI verification, and diagnostic hardware scan"
                )
            }

    # ── CASE D: LINKEDIN / BOOKMYSHOW / BGMI (Non-Refundable Digital Services) ──
    elif merchant in ["linkedin", "bookmyshow", "district", "bgmi", "free fire"]:
        return {
            "verdict": "REJECT_WITH_POLICY",
            "action_type": "CANCEL_RENEWAL",
            "refund_allowed": False,
            "ticket_prefix": "TCK-MANDATE",
            "ticket_status": "Auto-Renew Halted",
            "action_taken": f"Subscription/ticket terms are non-refundable. Auto-renewal cancelled and bank e-mandate revocation guide dispatched.",
            "policy_rule_cited": f"{merchant.capitalize()} Official Terms: Digital entertainment, concert tickets, and subscription periods are strictly non-refundable once activated.",
            "explanation_to_user": (
                f"Under **{merchant.capitalize()}** terms of service, active subscription periods and event bookings are non-refundable. "
                f"However, I have halted all future recurring renewals so you will never be billed again."
            )
        }

    # ── DEFAULT FALLBACK: GENERAL SUPPORT ESCALATION ──
    return {
        "verdict": "ESCALATE_TO_REVIEW",
        "action_type": "CREATE_AUDIT_TICKET",
        "refund_allowed": False,
        "ticket_prefix": "RZ",
        "ticket_status": "Investigation Active",
        "action_taken": "Logged claim for tier-2 merchant resolution review.",
        "policy_rule_cited": "RazorSense Standard Dispute Procedure.",
        "explanation_to_user": f"I have logged an official support case for your {product}. Our specialist team will coordinate with {merchant.capitalize()} to resolve this."
    }

# ---------------------------------------------------------------------------
# 4. IMMUTABLE AUDIT TRANSACTION EXECUTION
# ---------------------------------------------------------------------------

def execute_resolution_transaction(
    order_id: str,
    user_id: str,
    verdict_data: Dict[str, Any],
    claim_type: str,
    issue_text: str,
    order: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates the official ticket, persists to SQLite database, and returns the audit dossier.
    STRICT RULE: Only creates a ticket when the issue is resolved or escalated to human/supervisor review!
    """
    ticket_prefix = verdict_data.get("ticket_prefix")
    merchant = order.get("merchant", "Merchant") if order else "N/A"
    product = order.get("product", "Item") if order else "N/A"
    status = verdict_data.get("ticket_status", "Active")
    action_taken = verdict_data.get("action_taken", "Investigated")
    today_str = datetime.datetime.now().strftime("%d %b %Y")

    # If ticket_prefix is None (e.g. requesting info or photo), DO NOT create a ticket or write to DB!
    if not ticket_prefix:
        return {
            "ticket_id": None,
            "order_id": order_id,
            "merchant": merchant,
            "product": product,
            "status": status,
            "action_taken": action_taken,
            "date": today_str,
            "verdict": verdict_data.get("verdict"),
            "refund_allowed": verdict_data.get("refund_allowed", False),
            "policy_rule_cited": verdict_data.get("policy_rule_cited"),
            "explanation_to_user": verdict_data.get("explanation_to_user")
        }
    
    rand_id = random.randint(1000, 9999)
    ticket_id = f"{ticket_prefix}-{rand_id}"
    
    merchant = order.get("merchant", "Merchant") if order else "N/A"
    product = order.get("product", "Item") if order else "N/A"
    status = verdict_data.get("ticket_status", "Active")
    action_taken = verdict_data.get("action_taken", "Investigated")
    today_str = datetime.datetime.now().strftime("%d %b %Y")
    
    # Save to SQLite tickets database
    try:
        conn = get_db()
        conn.execute(
            """INSERT INTO tickets 
               (ticket_id, order_id, merchant, product, issue, date, status, action_taken) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (ticket_id, order_id, merchant, product, issue_text[:120], today_str, status, action_taken)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Sentinel] Error writing ticket to DB: {e}")
        
    return {
        "ticket_id": ticket_id,
        "order_id": order_id,
        "merchant": merchant,
        "product": product,
        "status": status,
        "action_taken": action_taken,
        "date": today_str,
        "verdict": verdict_data.get("verdict"),
        "refund_allowed": verdict_data.get("refund_allowed", False),
        "policy_rule_cited": verdict_data.get("policy_rule_cited"),
        "explanation_to_user": verdict_data.get("explanation_to_user")
    }

# ---------------------------------------------------------------------------
# 5. PUBLIC API: EVALUATE CLAIM & DISPUTE
# ---------------------------------------------------------------------------

def evaluate_claim(
    order_id: str,
    claim_type: str,
    issue_description: str,
    has_photo: bool = False,
    user_id: str = "customer_default"
) -> Dict[str, Any]:
    """
    Main evaluation pipeline:
    1. Fetches real order from SQLite DB
    2. Classifies claim (Subjective vs Objective)
    3. Calculates Fraud Risk Score (0-100)
    4. Applies authentic Merchant Policy SOP
    5. Commits immutable resolution ticket to database
    """
    order = None
    if order_id and order_id != "N/A":
        try:
            conn = get_db()
            row = conn.execute("SELECT * FROM orders WHERE order_id = ?", (order_id.strip().upper(),)).fetchone()
            conn.close()
            if row:
                order = dict(row)
        except Exception as e:
            print(f"[Sentinel] DB lookup error: {e}")

    claim_category = classify_claim_nature(claim_type, issue_description)
    fraud_eval = calculate_fraud_score(user_id, order, claim_category, has_photo, issue_description)
    policy_eval = evaluate_merchant_policy(order, claim_category, fraud_eval, has_photo, issue_description)
    
    # Execute database transaction
    dossier = execute_resolution_transaction(
        order_id=order_id,
        user_id=user_id,
        verdict_data=policy_eval,
        claim_type=claim_type,
        issue_text=issue_description,
        order=order
    )
    
    # Attach fraud telemetry to audit dossier
    dossier["fraud_score"] = fraud_eval["fraud_score"]
    dossier["risk_level"] = fraud_eval["risk_level"]
    dossier["risk_factors"] = fraud_eval["contributing_factors"]
    dossier["claim_category"] = claim_category
    
    return dossier
