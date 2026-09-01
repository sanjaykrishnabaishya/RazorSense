from typing import TypedDict, List, Dict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.ai_core import get_llm
from app.rag import query_brain

# Define the state of our graph
class AgentState(TypedDict):
    messages: List[Dict[str, str]]
    dispute_context: str
    clarification_needed: bool
    final_decision: str

def initial_analysis(state: AgentState):
    """
    Analyzes the initial user complaint and queries the RAG brain for context.
    """
    messages = state["messages"]
    last_user_message = [m["content"] for m in messages if m["role"] == "user"][-1]
    
    # Query the brain for legal precedents and fraud tactics
    brain_results = query_brain(last_user_message, n_results=1)
    context = ""
    if brain_results and brain_results["documents"] and len(brain_results["documents"][0]) > 0:
        context = brain_results["documents"][0][0]
    
    # Ask the LLM if it has enough info or needs clarifying questions
    llm = get_llm()
    system_prompt = f"""You are RazorSense, an autonomous dispute resolution AI. 
    Act as a human brain. Read the user's complaint. 
    Relevant historical context/fraud vectors: {context}
    
    If the complaint is vague or missing evidence (like a photo, unboxing details, or clear explanation), respond directly with a clarifying question to the user (e.g., asking for a better photo or more details).
    If you have enough information and evidence to make a firm decision, respond with exactly the word: 'DECISION_READY'.
    """
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=last_user_message)
    ])
    
    clarification_needed = response.content.strip() != "DECISION_READY"
    
    if clarification_needed:
        messages.append({"role": "ai", "content": response.content})
    
    return {"messages": messages, "dispute_context": context, "clarification_needed": clarification_needed}

def make_decision(state: AgentState):
    """
    Makes the final decision if no further clarification is needed.
    """
    llm = get_llm()
    system_prompt = f"""You are RazorSense, an autonomous dispute resolution AI.
    Context from our Fraud Brain: {state['dispute_context']}
    
    Based on the conversation history and context, make a final decision on this dispute.
    Output ONLY one of the following exact statuses based on risk: 
    REFUND_SCHEDULED (Low risk, clear evidence of merchant/logistics fault)
    HUMAN_INTERVENTION (Ambiguous, middle risk, requires manual review)
    REJECTED (High risk, known fraud vector matched, violation of terms)
    """
    
    chat_history = [HumanMessage(content=m["content"]) if m["role"] == "user" else AIMessage(content=m["content"]) for m in state["messages"]]
    chat_history.insert(0, SystemMessage(content=system_prompt))
    
    response = llm.invoke(chat_history)
    
    return {"final_decision": response.content.strip()}

def should_clarify(state: AgentState):
    """
    Conditional edge to determine routing.
    """
    if state["clarification_needed"]:
        return "ask_user"
    return "make_decision"

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("analyze", initial_analysis)
workflow.add_node("make_decision", make_decision)

workflow.set_entry_point("analyze")

# If clarification is needed, we end the current turn to ask the user (in a real app, we return the response to the frontend)
# If not, we proceed to make a decision
workflow.add_conditional_edges(
    "analyze",
    should_clarify,
    {
        "ask_user": END,
        "make_decision": "make_decision"
    }
)

workflow.add_edge("make_decision", END)

razorsense_agent = workflow.compile()
