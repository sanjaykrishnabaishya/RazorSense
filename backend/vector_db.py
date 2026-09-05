import chromadb
import os
from chromadb.config import Settings

# Initialize Persistent ChromaDB Client
db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=db_path)

# 1. KNOWLEDGE BASE COLLECTION (Point #3)
kb_collection = client.get_or_create_collection(name="knowledge_base")

# 2. SEMANTIC CACHE COLLECTION (Point #4)
cache_collection = client.get_or_create_collection(name="semantic_cache")

def seed_knowledge_base():
    """Populates the Vector DB with company policies if empty."""
    if kb_collection.count() == 0:
        docs = [
            "Return Policy: Items can be returned within 15 days of delivery. If the item is opened but not defective, a 15% restocking fee will be deducted from the refund.",
            "Refund Timeline: Refunds are processed immediately upon approval but may take 3 to 5 business days to reflect in the customer's bank account or credit card.",
            "Warranty Terms: All electronics come with a standard 1-year manufacturer warranty. Accidental damage (like drops or water spills) is strictly NOT covered.",
            "Shipping Delays: If an order is delayed by more than 48 hours past the estimated delivery date, the customer is entitled to a $5 appeasement credit.",
            "Missing Items: If a customer claims an item is missing from the box, support must request photos of the original packaging and verify the package weight logs before issuing a replacement."
        ]
        ids = [f"doc_{i}" for i in range(len(docs))]
        kb_collection.add(documents=docs, ids=ids)
        print("Knowledge Base seeded successfully.")

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
