from fastapi import FastAPI
from app.database import engine, Base
import app.models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RazorSense API",
    description="Autonomous post-purchase dispute resolution engine.",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"status": "RazorSense API is running"}
