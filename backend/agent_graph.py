from typing import TypedDict, Annotated, Sequence
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
    current_order_id: str
    intent: str

# -----------------
# NODES (Agents)
# -----------------

def supervisor_agent(state: AgentState):
    """
    The Brain. Analyzes the user's message, scrubs PII, and decides which agent to route to next.
    In production, this calls an LLM (e.g. OpenAI) with a routing prompt.
    """
    last_message = state["messages"][-1].content
    
    # 1. Redact PII before processing
    scrubbed_message = pii_redactor.redact(last_message)
    print(f"[Supervisor] Scrubbed Input: {scrubbed_message}")
    
    # 2. Intent Routing Logic (Mocked LLM Router for demonstration)
    lower_msg = scrubbed_message.lower()
    
    if "policy" in lower_msg or "refund" in lower_msg or "late" in lower_msg:
        next_agent = "PolicyAgent"
    elif "order" in lower_msg or "status" in lower_msg:
        next_agent = "OrderAgent"
    elif "ticket" in lower_msg or "create" in lower_msg:
        next_agent = "ActionAgent"
    else:
        next_agent = "HumanEscalationAgent" # Fallback
        
    return {"next_agent": next_agent}


def order_agent(state: AgentState):
    """Fetches Order Data from DB securely."""
    # Simulating tool call to GET /api/orders/{order_id}
    # In production, this would make an internal HTTP call to our secure API
    response = "I have fetched your order details securely. (Mocked Order Data)"
    return {"messages": [AIMessage(content=response, name="OrderAgent")]}


def policy_agent(state: AgentState):
    """Uses RAG to fetch policies."""
    # Simulating RAG call
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
        "OrderAgent": "OrderAgent",
        "PolicyAgent": "PolicyAgent",
        "ActionAgent": "ActionAgent",
        "HumanEscalationAgent": END # End conversation if it requires human
    }
)

# All agents route back to END for now, or could route back to Supervisor
workflow.add_edge("OrderAgent", END)
workflow.add_edge("PolicyAgent", END)
workflow.add_edge("ActionAgent", END)

# Compile Graph
app = workflow.compile()

# Example Usage
if __name__ == "__main__":
    test_state = {
        "messages": [HumanMessage(content="What is the refund policy? My phone is 9999999999.")],
        "user_id": 1,
        "current_order_id": "",
        "intent": "",
        "next_agent": ""
    }
    
    for s in app.stream(test_state):
        print(s)
