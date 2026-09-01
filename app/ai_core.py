import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

def get_llm():
    """
    Initializes the connection to OpenRouter specifically targeting 
    the requested Nvidia Nemotron model.
    """
    return ChatOpenAI(
        model="nvidia/nemotron-3-ultra-550b-a55b",
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base=OPENROUTER_BASE_URL,
        max_tokens=1500,
        temperature=0.2 # Low temperature for analytical decision making
    )
