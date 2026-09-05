import os
import time
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

load_dotenv("../.env")

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="nvidia/nemotron-3-ultra-550b-a55b:free"
)

class SupervisorDecision(BaseModel):
    next_agent: str = Field(description="One of: PolicyAgent, OrderAgent, ActionAgent, ClarificationAgent, HumanEscalationAgent")
    extracted_checklist: dict = Field(description="Key-value pairs of extracted order details")

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are the RazorSense Support Supervisor. Analyze the user message.\n"
                "Current Checklist: {checklist}\n"
                "Extract any missing fields: order_id, order_date, merchant_name, product_details, payment_mode, issue, demand.\n"
                "Decide the next agent to route to:\n"
                "- ClarificationAgent: If any of the 7 checklist fields are still missing.\n"
                "- PolicyAgent: If the user is asking about refunds, policies, or returns.\n"
                "- OrderAgent: If the user is asking about order status or tracking.\n"
                "- ActionAgent: If the user is explicitly confirming they want to create a ticket and the checklist is full.\n"
                "- HumanEscalationAgent: If the user is angry, complaining about delivery drivers, or there is fraud."),
    ("user", "{message}")
])

def test_structured_latency(message: str, checklist: dict):
    print(f"\n[Testing Structured Output] Message: '{message}'")
    chain = prompt | llm.with_structured_output(SupervisorDecision)
    start = time.time()
    try:
        res = chain.invoke({"checklist": json.dumps(checklist), "message": message})
        elapsed = time.time() - start
        print(f"Time: {elapsed:.2f} seconds")
        print(f"Result: {res}")
        return elapsed
    except Exception as e:
        elapsed = time.time() - start
        print(f"Failed in {elapsed:.2f}s: {e}")
        return elapsed

def test_raw_latency(message: str, checklist: dict):
    print(f"\n[Testing Raw Text Output] Message: '{message}'")
    # Tell it to just output JSON text
    raw_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the RazorSense Support Supervisor. Analyze the user message.\n"
                   "Current Checklist: {checklist}\n"
                   "Extract missing fields (order_id, order_date, merchant_name, product_details, payment_mode, issue, demand).\n"
                   "Decide next agent: ClarificationAgent, PolicyAgent, OrderAgent, ActionAgent, HumanEscalationAgent.\n\n"
                   "CRITICAL: Output ONLY valid JSON in this exact format, with NO markdown code blocks or extra text:\n"
                   "{{\"next_agent\": \"AgentName\", \"extracted_checklist\": {{\"issue\": \"value\"}}}}"),
        ("user", "{message}")
    ])
    chain = raw_prompt | llm
    start = time.time()
    try:
        res = chain.invoke({"checklist": json.dumps(checklist), "message": message})
        elapsed = time.time() - start
        print(f"Time: {elapsed:.2f} seconds")
        print(f"Result: {res.content}")
        return elapsed
    except Exception as e:
        elapsed = time.time() - start
        print(f"Failed in {elapsed:.2f}s: {e}")
        return elapsed

if __name__ == "__main__":
    test_msg = "I ordered an iPhone 15 Pro but the delivery box had a bar of soap inside! Order #AMZ999. I need an immediate refund and an investigation!"
    empty_checklist = {}
    
    t1 = test_structured_latency(test_msg, empty_checklist)
    t2 = test_raw_latency(test_msg, empty_checklist)
    
    print("\n--- Summary ---")
    print(f"Structured Latency: {t1:.2f}s")
    print(f"Raw JSON Latency: {t2:.2f}s")
