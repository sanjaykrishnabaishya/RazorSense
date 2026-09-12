import chromadb
import os
from chromadb.config import Settings
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from google import genai
from dotenv import load_dotenv

load_dotenv()

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        client = genai.Client()
        embeddings = []
        for text in input:
            res = client.models.embed_content(model='gemini-embedding-001', contents=text)
            embeddings.append(res.embeddings[0].values)
        return embeddings

gemini_ef = GeminiEmbeddingFunction()

# Initialize Persistent ChromaDB Client
db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=db_path, settings=Settings(anonymized_telemetry=False))

# 1. KNOWLEDGE BASE COLLECTION (Point #3)
kb_collection = client.get_or_create_collection(name="knowledge_base_v3", embedding_function=gemini_ef)

# 2. SEMANTIC CACHE COLLECTION (Point #4)
cache_collection = client.get_or_create_collection(name="semantic_cache_v3", embedding_function=gemini_ef)

def seed_knowledge_base():
    """Populates the Vector DB with the comprehensive 4-Pillar Enterprise Rule Book."""
    if kb_collection.count() == 0:
        docs = [
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
            "Service Outages & Non-Delivery of Digital Services (Pillar 4): If a paid digital service or subscription experiences unscheduled downtime exceeding 24 consecutive hours, impacted subscribers are entitled to a pro-rata credit or refund for the affected downtime duration."
        ]
        ids = [f"doc_{i}" for i in range(len(docs))]
        kb_collection.add(documents=docs, ids=ids)
        print("Knowledge Base seeded successfully with full 4-Pillar Enterprise Rule Book.")

def query_knowledge_base(query: str) -> str:
    """Searches the vector database for the most relevant policy."""
    results = kb_collection.query(query_texts=[query], n_results=1)
    if results['documents'] and results['documents'][0]:
        return results['documents'][0][0]
    return "No relevant policy found."

def check_semantic_cache(query: str):
    """Checks if a highly similar query was already asked."""
    if cache_collection.count() == 0:
        return None
        
    results = cache_collection.query(query_texts=[query], n_results=1)
    # distance is lower if they are more similar.
    # A distance < 0.2 means the semantic meaning is almost identical.
    if results['distances'] and results['distances'][0] and len(results['distances'][0]) > 0:
        distance = results['distances'][0][0]
        if distance < 0.25:
            # Return the cached response
            return results['metadatas'][0][0]['response']
    return None

def add_to_semantic_cache(query: str, response: str):
    """Caches a new query and its response."""
    doc_id = f"cache_{cache_collection.count() + 1}"
    cache_collection.add(
        documents=[query],
        metadatas=[{"response": response}],
        ids=[doc_id]
    )

if __name__ == "__main__":
    seed_knowledge_base()
