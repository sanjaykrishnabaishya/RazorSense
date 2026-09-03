import os
import chromadb
from chromadb.utils import embedding_functions

class PolicyRAG:
    """
    Retrieval-Augmented Generation (RAG) module for RazorSense.
    Ingests merchant policy documents and allows the PolicyAgent to query them.
    """
    def __init__(self, db_path="./chroma_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Using a lightweight default embedding model for speed
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        self.collection = self.client.get_or_create_collection(
            name="merchant_policies",
            embedding_function=self.embedding_fn
        )

    def ingest_documents(self, kb_dir="./knowledge_base"):
        """Reads all markdown files in the knowledge base and vectors them."""
        print(f"Ingesting policies from {kb_dir}...")
        for filename in os.listdir(kb_dir):
            if filename.endswith(".md"):
                merchant = filename.split('_')[0].capitalize()
                filepath = os.path.join(kb_dir, filename)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Split content by paragraphs (Naive chunking)
                chunks = [chunk.strip() for chunk in content.split('\n\n') if chunk.strip()]
                
                for i, chunk in enumerate(chunks):
                    doc_id = f"{merchant}_chunk_{i}"
                    
                    self.collection.add(
                        documents=[chunk],
                        metadatas=[{"merchant": merchant, "source": filename}],
                        ids=[doc_id]
                    )
        print("Ingestion complete.")

    def query_policy(self, merchant_name: str, query_text: str, n_results: int = 2):
        """
        Retrieves the most relevant policy clause for a given merchant and query.
        """
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={"merchant": merchant_name} # Filter by merchant
        )
        
        if results['documents'] and len(results['documents']) > 0:
            return results['documents'][0]
        return []

# Example Usage
if __name__ == "__main__":
    rag = PolicyRAG()
    # rag.ingest_documents() # Run this once to populate DB
    # res = rag.query_policy("Amazon", "What is the refund policy for electronics?")
    # print(res)
