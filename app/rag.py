import chromadb
import json

# Initialize ChromaDB locally to act as the legal and tactical "brain"
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Create or get the collection for our edge cases
collection = chroma_client.get_or_create_collection(name="razorsense_brain")

def ingest_edge_cases(json_filepath: str):
    """
    Ingests the 500-case taxonomy JSON into ChromaDB to act as the 'brain'.
    This embeds real legal realities and fraud tactics into the Vector DB.
    """
    try:
        with open(json_filepath, 'r') as file:
            data = json.load(file)
        
        cases = data.get("cases", [])
        
        for case in cases:
            # Combine the fields into a dense context block for the LLM
            doc_text = f"Sector: {case['sector']} | Scenario: {case['scenario_description']} | Fraud Vector: {case['fraud_vector']} | Legal Precedent: {case['legal_precedent']} | Action: {case['autonomous_resolution_action']}"
            
            collection.add(
                documents=[doc_text],
                metadatas=[{"case_id": case["case_id"], "sector": case["sector"]}],
                ids=[case["case_id"]]
            )
        print(f"Successfully ingested {len(cases)} edge cases into the RazorSense brain.")
    except Exception as e:
        print(f"Error ingesting data: {e}")

def query_brain(query_text: str, n_results: int = 3):
    """
    Queries the RAG brain for similar fraud patterns and legal precedents.
    Returns the top N matches to help the LangGraph agent make a decision.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    return results
