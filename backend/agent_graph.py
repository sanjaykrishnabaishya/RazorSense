from typing import TypedDict, Annotated, Sequence, Dict, Any
import operator
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from pii_redactor import PIIRedactor
import json

# Initialize PII Redactor
pii_redactor = PIIRedactor()

# Define the State of the Graph
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next_agent: str
    user_id: int
    intent: str
    # Master Dispute Checklist
    checklist: Dict[str, Any]

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

load_dotenv("../.env")

# Initialize OpenRouter LLM (Fast Nemotron Lightning)
llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    model="nvidia/nemotron-3-ultra-550b-a55b:free"
)

# Define Structured Output for Supervisor
class SupervisorDecision(BaseModel):
    next_agent: str = Field(description="One of: PolicyAgent, OrderAgent, ActionAgent, ClarificationAgent, HumanEscalationAgent")
    extracted_checklist: Dict[str, Any] = Field(description="Key-value pairs of extracted order details")

def supervisor_agent(state: AgentState):
    """
    The Brain. Analyzes the user's message, scrubs PII, extracts checklist items,
    and decides whether to ask for clarification or route to a specific agent using Nemotron via OpenRouter.
    """
    last_message = state["messages"][-1].content
    
    # 1. Redact PII before processing
    scrubbed_message = pii_redactor.redact(last_message)
    print(f"[Supervisor] Scrubbed Input: {scrubbed_message}")
    
    # 2. Check the Master Dispute Checklist
    current_checklist = state.get("checklist", {})
    
    # 3. Use LLM to analyze intent and extract fields
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
    
    # We use structured output to get a clean JSON response from the LLM
    chain = prompt | llm.with_structured_output(SupervisorDecision)
    
    try:
        decision = chain.invoke({"checklist": json.dumps(current_checklist), "message": scrubbed_message})
        
        # Merge new extracted fields into checklist
        for k, v in decision.extracted_checklist.items():
            if v and v.strip() != "":
                current_checklist[k] = v
                
        # Hard check for missing fields just in case LLM hallucinations
        required_fields = ["order_id", "order_date", "merchant_name", "product_details", "payment_mode", "issue", "demand"]
        missing_fields = [field for field in required_fields if not current_checklist.get(field)]
        
        if missing_fields:
            next_agent = "ClarificationAgent"
        else:
            next_agent = decision.next_agent
            
    except Exception as e:
        print(f"[Supervisor Error] LLM failed: {e}")
        next_agent = "HumanEscalationAgent"
        
    return {"next_agent": next_agent, "checklist": current_checklist}


def clarification_agent(state: AgentState):
    """Asks the user for missing fields from the Master Dispute Checklist."""
    checklist = state.get("checklist", {})
    required_fields = ["order_id", "order_date", "merchant_name", "product_details", "payment_mode", "issue", "demand"]
    missing_fields = [field for field in required_fields if not checklist.get(field)]
    
    # Use the fast LLM for conversational generation
    from fast_ack import fast_llm
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are Krish, a friendly customer support AI for RazorSense. "
                   "The user has an issue, but we are missing some details to help them.\n"
                   "Missing fields: {missing_fields}\n\n"
                   "Task: Write a very short, polite 1-2 sentence response. Acknowledge what they just said, "
                   "then ask them to provide ONE of the missing fields (e.g. Order ID or what the issue is). "
                   "Do not ask for all of them at once. Keep it natural like a human agent."),
        ("user", "{last_msg}")
    ])
    
    chain = prompt | fast_llm
    try:
        res = chain.invoke({
            "missing_fields": ", ".join(missing_fields),
            "last_msg": state["messages"][-1].content
        })
        response = res.content
    except Exception as e:
        field_to_ask = missing_fields[0].replace("_", " ").title()
        response = f"I'd love to help you with that! Could you please provide your {field_to_ask}?"
        
    return {"messages": [AIMessage(content=response, name="ClarificationAgent")]}


def order_agent(state: AgentState):
    """Fetches Order Data from DB securely."""
    response = "I have fetched your order details securely. (Mocked Order Data)"
    return {"messages": [AIMessage(content=response, name="OrderAgent")]}


def policy_agent(state: AgentState):
    """Uses RAG to fetch policies."""
    response = "Based on the Merchant Policy, you are eligible for a replacement. (Mocked RAG Data)"
    return {"messages": [AIMessage(content=response, name="PolicyAgent")]}


def action_agent(state: AgentState):
    """Executes actions like creating a ticket."""
    response = "I have created a support ticket for your issue. Ticket ID: RZ-XXXXX."
    return {"messages": [AIMessage(content=response, name="ActionAgent")]}

# -----------------
# GRAPH DEFINITION
# -----------------
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("Supervisor", supervisor_agent)
workflow.add_node("ClarificationAgent", clarification_agent)
workflow.add_node("OrderAgent", order_agent)
workflow.add_node("PolicyAgent", policy_agent)
workflow.add_node("ActionAgent", action_agent)

# Add Edges
workflow.set_entry_point("Supervisor")

# The supervisor routes to the specific sub-agents based on the 'next_agent' state
workflow.add_conditional_edges(
    "Supervisor",
    lambda state: state["next_agent"],
    {
        "ClarificationAgent": "ClarificationAgent",
        "OrderAgent": "OrderAgent",
        "PolicyAgent": "PolicyAgent",
        "ActionAgent": "ActionAgent",
        "HumanEscalationAgent": END # End conversation if it requires human
    }
)

# All agents route back to END for now, waiting for user input
workflow.add_edge("ClarificationAgent", END)
workflow.add_edge("OrderAgent", END)
workflow.add_edge("PolicyAgent", END)
workflow.add_edge("ActionAgent", END)

# Compile Graph
app = workflow.compile()

# Example Usage
if __name__ == "__main__":
    test_state = {
        "messages": [HumanMessage(content="I want a refund for my damaged shoes.")],
        "user_id": 1,
        "intent": "refund",
        "next_agent": "",
        # Empty checklist to trigger ClarificationAgent
        "checklist": {}
    }
    
    for s in app.stream(test_state):
        print(s)
