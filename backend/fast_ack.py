from fastapi import APIRouter
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv("../.env")

router = APIRouter()

fast_llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="nvidia/nemotron-3.5-lightning:free"
)

class AckRequest(BaseModel):
    message: str

@router.post("/api/fast_ack")
async def get_fast_acknowledgment(req: AckRequest):
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a customer support AI. The user just sent a message. "
                   "Your job is to provide a very short, polite, 1-sentence acknowledgment that you are looking into it. "
                   "Do not solve the problem. Just say you are checking. "
                   "Example: 'I'm pulling up your order details right now...'"),
        ("user", "{message}")
    ])
    
    chain = prompt | fast_llm
    try:
        # This takes < 1 second
        response = chain.invoke({"message": req.message})
        return {"ack": response.content.replace('"', '')}
    except Exception as e:
        return {"ack": "I'm looking into this for you right now..."}
