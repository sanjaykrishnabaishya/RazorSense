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

# -----------------
# NODES (Agents)
# -----------------

def supervisor_agent(state: AgentState):
    """
    The Brain. Analyzes the user's message, scrubs PII, extracts checklist items,
    and decides whether to ask for clarification or route to a specific agent.
    """
    last_message = state["messages"][-1].content
    
    # 1. Redact PII before processing
    scrubbed_message = pii_redactor.redact(last_message)
    print(f"[Supervisor] Scrubbed Input: {scrubbed_message}")
    
    # 2. Check the Master Dispute Checklist
    checklist = state.get("checklist", {})
    required_fields = ["order_id", "order_date", "merchant_name", "product_details", "payment_mode", "issue", "demand"]
    
    # In production, an LLM would read `scrubbed_message` to extract entities 
    # and update the checklist here. We mock it by checking if it's full.
    missing_fields = [field for field in required_fields if not checklist.get(field)]
    
    if missing_fields:
        # We need more information! Route to ClarificationAgent
        return {"next_agent": "ClarificationAgent"}
    
    # 3. Intent Routing Logic (Once checklist is full)
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


def clarification_agent(state: AgentState):
    """Asks the user for missing fields from the Master Dispute Checklist."""
    checklist = state.get("checklist", {})
    required_fields = ["order_id", "order_date", "merchant_name", "product_details", "payment_mode", "issue", "demand"]
    missing_fields = [field for field in required_fields if not checklist.get(field)]
    
    # Ask for the first missing field (In production, an LLM formats this nicely)
    field_to_ask = missing_fields[0].replace("_", " ").title()
    
    if field_to_ask == "Payment Mode":
        response = "Could you please tell me your Payment Mode? (Note: If you paid via COD, you will need to provide bank account or UPI details for the refund)."
    else:
        response = f"To help you resolve this, could you please provide the {field_to_ask}?"
        
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
