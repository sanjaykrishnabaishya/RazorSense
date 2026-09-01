from fastapi import FastAPI
from app.database import engine, Base
import app.models
from app.rag import ingest_edge_cases
import os

# Create database tables
Base.metadata.create_all(bind=engine)

# Ingest edge cases into ChromaDB if taxonomy exists
if os.path.exists("taxonomy.json"):
    ingest_edge_cases("taxonomy.json")

app = FastAPI(
    title="RazorSense API",
    description="Autonomous post-purchase dispute resolution engine.",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"status": "RazorSense API is running"}
