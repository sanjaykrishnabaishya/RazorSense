import chromadb
import os
import hashlib
from chromadb.config import Settings
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from google import genai
from google.genai.types import HttpOptions, HttpRetryOptions
from dotenv import load_dotenv

load_dotenv()

# The Comprehensive Enterprise Rule Book & Domain SOPs
ENTERPRISE_POLICIES = [
    # --- PILLAR 1: FRAUD & AUTHORIZATION ---
    "Fraud & Stolen Card Policy (Pillar 1): If a customer reports an unauthorized charge or stolen card, support must immediately flag the transaction, recommend the user freeze their card with their issuing bank, and collect the transaction timestamp. If verified via 3D-Secure 2.0 (OTP/Biometric) with ECI 05, bank liability shift applies. For unauthenticated claims, escalate immediately to the fraud review desk.",
    "UPI Fraud & Unauthorized Transfer Protocol (Pillar 1): For unauthorized UPI charges, verify whether the private 6-digit MPIN and device SIM binding were utilized. Advise the user to immediately raise an NPCI grievance on their UPI app and freeze netbanking credentials. A priority escalation ticket must be dispatched within 15 minutes.",

    # --- PILLAR 2: FULFILLMENT & MERCHANDISE DISPUTES ---
    "Return Policy (Pillar 2): Physical items can be returned within 15 days of delivery provided they are in original condition. For opened but non-defective items, a 15% restocking fee applies. Digital downloads and perishables are non-returnable once dispatched.",
    "Damaged or Defective Items (Pillar 2): Customers must report damaged or defective merchandise within 48 hours of delivery and provide clear unboxing photos/videos showing the product and shipping label. Upon multimodal verification of transit damage or hardware defect, a free replacement RMA is dispatched immediately, or a 100% refund is issued upon courier pickup.",
    "Missing Items & Empty Box Claims (Pillar 2): If a customer claims an item was missing from a delivered parcel, support must request unboxing photos of the outer box with courier label, and verify warehouse outbound scale weight logs against carrier delivery scan weight before authorizing replacement.",
    "Counterfeit & Authenticity Grievances (Pillar 2): All merchant inventory is guaranteed 100% authentic under direct brand distribution agreements. If a counterfeit allegation is raised, support must log an inspection RMA to retrieve the unit for forensic barcode authentication.",

    # --- PILLAR 3: BILLING & PROCESSING ERRORS ---
    "Duplicate Billing & Double Charge Policy (Pillar 3): If a customer is billed twice for the same order due to network timeouts or gateway retries, the secondary duplicate authorization is automatically voided or refunded in full within 24 to 48 hours. Support can verify the dual Acquirer Reference Numbers (ARNs) and execute an instant refund for the duplicate transaction without requiring order return.",
    "Incorrect Amount Billed Policy (Pillar 3): If the amount charged on the customer's card statement differs from the checkout invoice total (e.g. currency conversion fee, erroneous tax calculation), support will immediately verify the checkout hash and credit the exact overcharge difference back to the original payment instrument within 24 hours.",
    "Paid by Alternate Payment Method Policy (Pillar 3): If a customer was charged electronically after paying via cash-on-delivery or alternate card, the customer must provide the receipt of alternate payment. Once confirmed, the duplicate online debit is reversed 100%.",

    # --- PILLAR 4: SUBSCRIPTIONS, RECURRING BILLING & DIGITAL SERVICES ---
    "Subscription Cancellation & Auto-Renewal Policy (Pillar 4): If a customer cancels a recurring subscription BEFORE the new billing cycle executes, any subsequent charge is deemed an automated error and is entitled to a 100% immediate refund with the recurring mandate permanently revoked.",
    "Post-Renewal Grace Period Policy (Pillar 4): If a customer requests a refund within 48 hours AFTER an automatic subscription renewal and has ZERO usage or benefit consumption during the new period, a 100% courtesy refund is approved immediately. If content or benefits were consumed, the subscription remains active through the end of the paid period and auto-renewal is canceled for all future cycles.",
    "Regulatory Pre-Debit Notification Mandate (Pillar 4): Under RBI E-Mandate and Visa Stored Credential regulations, a pre-debit notice must be dispatched to the cardholder at least 24 hours prior to recurring execution. If the merchant notification failed to dispatch, the customer is entitled to an automatic full refund upon request.",
    "Service Outages & Non-Delivery of Digital Services (Pillar 4): If a paid digital service or subscription experiences unscheduled downtime exceeding 24 consecutive hours, impacted subscribers are entitled to a pro-rata credit or refund for the affected downtime duration.",

    # --- DOMAIN SOP 1: RENTALS & ASSET LEASES (RentoMojo, Furlenco, Rentickle) ---
    "Rental Services & Security Deposit SOP (RentoMojo): Customers can terminate or upgrade a rental tenure with 7 days prior notice. Refundable security deposits are refunded 100% within 5-7 business days following asset pickup and automated Quality Check (QC). Minor everyday wear-and-tear is never deducted; structural damage, missing parts, or burn marks are deducted based on standardized component rate cards. Free maintenance and complimentary product swaps are provided for hardware or appliance breakdowns.",

    # --- DOMAIN SOP 2: ENTERTAINMENT, MOVIES & EVENT TICKETING (BookMyShow, District, Paytm Insider) ---
    "Entertainment & Event Ticket Cancellation SOP (BookMyShow/District): Movie tickets booked with 'Cancellation Protect' can be cancelled up to 2 hours before showtime for a 100% refund of base ticket value (internet handling fees non-refundable). Tickets without cancellation protection cannot be cancelled after confirmation. Concert passes, live sports, and arena music festivals are non-refundable unless the event is officially cancelled, postponed, or rescheduled by the organizer, in which case a 100% refund is initiated within 7-10 business days. Duplicate bookings or seat allocation timeouts are automatically refunded within 24 hours.",

    # --- DOMAIN SOP 3: E-SPORTS, IN-GAME CURRENCY & GAMING (BGMI, Free Fire, Steam, PlayStation, Riot) ---
    "E-Sports & Gaming Microtransactions SOP (BGMI/Free Fire/Steam): In-game currency top-ups (e.g. BGMI UC, Free Fire Diamonds, Steam Wallet, V-Bucks) that are debited from the bank/UPI account but not credited in-game within 10 minutes are eligible for an immediate gateway push or refund within 2 hours upon providing the Game UID and Transaction Reference. Once in-game currency or digital bundles (Royale Pass, Elite Pass, weapon skins) are claimed and consumed in the game client, purchases are non-refundable. For unauthorized purchases by minors or account compromises, support will immediately log a fraud dispute ticket with publisher telemetry.",

    # --- DOMAIN SOP 4: CAREER & PROFESSIONAL PLATFORMS (LinkedIn Premium, Naukri FastForward) ---
    "Professional & Career Platforms SOP (LinkedIn Premium/Naukri FastForward): Professional services (LinkedIn Premium Career/Recruiter, Naukri FastForward Resume Display/Job Spotlight) canceled within 48 hours of billing without benefit usage (zero InMails dispatched, no resume spotlight clicks consumed) receive an immediate 100% courtesy refund. Future recurring mandates (UPI Autopay, card standing instructions) are permanently terminated.",

    # --- DOMAIN SOP 5: TRAVEL, FLIGHTS, HOTELS & RAILWAYS (MakeMyTrip, Booking.com, ixigo, Cleartrip) ---
    "Travel, Flight, Hotel & Rail Bookings SOP (MakeMyTrip/Booking.com/ixigo): Under DGCA rules, domestic flight tickets cancelled within 24 hours of booking for flights departing more than 7 days later incur zero airline cancellation fees. For flight delays exceeding 6 hours or airline cancellations, full 100% ticket refunds are released within 48 hours of airline clearance. Hotel reservations with 'Free Cancellation' can be cancelled up to 24-48 hours before check-in for an instant full refund. For IRCTC rail tickets booked via ixigo/MMT, Waitlisted (WL) tickets that remain unconfirmed after chart preparation are automatically refunded 100% without requiring manual TDR filing.",

    # --- DOMAIN SOP 6: PAYMENT APPS, FINTECH & BANKING CHANNELS (BHIM, Navi, BharatPe, CRED, HDFC, ICICI, SBI, Axis) ---
    "Fintech Apps & Banking Network Settlement SOP (BHIM/Navi/BharatPe/CRED/HDFC/ICICI/SBI/Axis): For UPI transactions via BHIM, PhonePe, GPay, Paytm, Navi, or BharatPe where funds were deducted but merchant confirmation timed out (Pending/Failed status), NPCI auto-reversal mandates credit within T+1 working day (maximum 24-48 hours). For credit card bill payments via CRED, Axis, SBI YONO, HDFC, or ICICI that do not reflect instantly, UTR reconciliation tickets are tracked with a guaranteed resolution TAT of 48 hours. Duplicate debits are credited back automatically."
]

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        client = genai.Client(http_options=HttpOptions(retry_options=HttpRetryOptions(attempts=1)))
        embeddings = []
        for text in input:
            try:
                res = client.models.embed_content(model='text-embedding-004', contents=text)
                embeddings.append(res.embeddings[0].values)
            except Exception as e:
                # Deterministic pseudo-embedding to never hang or crash
                h = hashlib.sha256(text.encode('utf-8')).digest()
                pseudo_vector = [(b / 255.0) for b in h] * 24
                embeddings.append(pseudo_vector[:768])
        return embeddings

gemini_ef = GeminiEmbeddingFunction()

# Initialize Persistent ChromaDB Client
db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=db_path, settings=Settings(anonymized_telemetry=False))

# 1. KNOWLEDGE BASE COLLECTION
kb_collection = client.get_or_create_collection(name="knowledge_base_v6", embedding_function=gemini_ef)

# 2. SEMANTIC CACHE COLLECTION
cache_collection = client.get_or_create_collection(name="semantic_cache_v6", embedding_function=gemini_ef)

def seed_knowledge_base():
    """Populates the Vector DB with the comprehensive 4-Pillar Enterprise Rule Book."""
    try:
        if kb_collection.count() == 0:
            ids = [f"doc_{i}" for i in range(len(ENTERPRISE_POLICIES))]
            kb_collection.add(documents=ENTERPRISE_POLICIES, ids=ids)
            print("Knowledge Base seeded successfully with full 4-Pillar Enterprise Rule Book.")
    except Exception as e:
        print(f"[VectorDB] Seed notice: {e}")

def query_knowledge_base(query: str) -> str:
    """Searches the knowledge base for the most relevant policy using hybrid keyword + vector retrieval."""
    query_clean = query.lower()
    
    # 1. Exact high-confidence domain keyword matcher (instant, 100% precision)
    tokens = set(query_clean.split())
    best_doc = None
    best_score = 0
    
    for doc in ENTERPRISE_POLICIES:
        doc_lower = doc.lower()
        score = sum(1 for t in tokens if len(t) > 3 and t in doc_lower)
        if any(k in query_clean for k in ["rent", "rentomojo", "deposit", "tenure", "furlenco"]) and "rentomojo" in doc_lower:
            score += 15
        if any(k in query_clean for k in ["movie", "bookmyshow", "district", "concert", "show", "ticket", "seat", "coldplay"]) and "bookmyshow" in doc_lower:
            score += 15
        if any(k in query_clean for k in ["game", "gaming", "bgmi", "free fire", "freefire", "diamond", "uc", "steam", "royale pass", "krafton"]) and "bgmi" in doc_lower:
            score += 15
        if any(k in query_clean for k in ["linkedin", "naukri", "career", "resume", "inmail", "spotlight"]) and "linkedin" in doc_lower:
            score += 15
        if any(k in query_clean for k in ["flight", "hotel", "travel", "makemytrip", "ixigo", "train", "pnr", "airline", "dgca", "booking.com"]) and "makemytrip" in doc_lower:
            score += 15
        if any(k in query_clean for k in ["bhim", "navi", "bharatpe", "cred", "bill pay", "utr", "npci", "yono", "imobile", "payzapp"]) and "bhim" in doc_lower:
            score += 15
        if "duplicate" in query_clean and "duplicate" in doc_lower:
            score += 10
        if "fraud" in query_clean and "fraud" in doc_lower:
            score += 10
        if "damage" in query_clean and "damage" in doc_lower:
            score += 8
        if "stolen" in query_clean and "stolen" in doc_lower:
            score += 10
        if ("subscription" in query_clean or "renew" in query_clean or "mandate" in query_clean) and "subscription" in doc_lower:
            score += 8
        if "return" in query_clean and "return policy" in doc_lower:
            score += 8

        if score > best_score:
            best_score = score
            best_doc = doc
            
    if best_doc and best_score >= 8:
        return best_doc

    # 2. Try Vector DB semantic search
    try:
        results = kb_collection.query(query_texts=[query], n_results=1)
        if results and results.get('documents') and results['documents'][0]:
            return results['documents'][0][0]
    except Exception as e:
        print(f"[VectorDB] ChromaDB query notice: {e}")

    return best_doc or ENTERPRISE_POLICIES[2]

def check_semantic_cache(query: str):
    """Checks if a highly similar query was already asked."""
    try:
        if cache_collection.count() == 0:
            return None
        results = cache_collection.query(query_texts=[query], n_results=1)
        if results.get('distances') and results['distances'][0] and len(results['distances'][0]) > 0:
            distance = results['distances'][0][0]
            if distance < 0.25:
                return results['metadatas'][0][0]['response']
    except Exception as e:
        pass
    return None

def add_to_semantic_cache(query: str, response: str):
    """Caches a new query and its response."""
    try:
        doc_id = f"cache_{cache_collection.count() + 1}"
        cache_collection.add(
            documents=[query],
            metadatas=[{"response": response}],
            ids=[doc_id]
        )
    except Exception as e:
        pass

if __name__ == "__main__":
    seed_knowledge_base()
