import json
import random
import itertools

def generate_massive_dataset():
    """
    Programmatically generates 100+ standard cases and 100+ edge cases 
    covering various permutations of intents, missing fields, PII, and sentiments.
    """
    dataset = []

    # ---------------------------
    # 1. GENERATE ACTUAL CASES
    # ---------------------------
    intents = ["refund", "replacement", "track order", "cancel order", "invoice"]
    merchants = ["Amazon", "Zomato", "Flipkart", "Swiggy"]
    issues = ["damaged item", "late delivery", "wrong item", "missing item"]
    missing_fields_options = [
        [], # Complete
        ["order_id"],
        ["payment_mode"],
        ["issue", "demand"]
    ]
    
    # Generate standard permutations
    for intent, merchant, issue, missing in itertools.product(intents, merchants, issues, missing_fields_options):
        if len(dataset) >= 100:
            break
            
        desc = f"Standard {intent} for {merchant} regarding {issue}"
        if missing:
            desc += f" (Missing: {', '.join(missing)})"
            
        content = f"I want a {intent} from {merchant} because of {issue}."
        if not missing:
            content += " Order ID is #123. Paid via UPI."
            expected = "ActionAgent" if intent in ["refund", "replacement", "cancel order"] else "OrderAgent"
        else:
            expected = "ClarificationAgent"
            
        dataset.append({
            "description": desc,
            "type": "actual_case",
            "input_messages": [{"role": "user", "content": content}],
            "expected_routing": expected
        })

    # ---------------------------
    # 2. GENERATE EDGE CASES
    # ---------------------------
    edge_cases = []
    
    # A. PII Injection Edge Cases (Stress Testing Redactor)
    pii_types = [
        "My phone is 9999999999", 
        "My UPI is test@okicici", 
        "My Aadhar is 1234 5678 9012", 
        "My PAN is ABCDE1234F",
        "My card is 4111 2222 3333 4444"
    ]
    for i in range(25):
        pii = random.sample(pii_types, k=random.randint(2, 4))
        edge_cases.append({
            "description": f"PII Stress Test #{i+1}",
            "type": "edge_case",
            "input_messages": [{"role": "user", "content": f"Cancel my order. {' '.join(pii)}"}],
            "expected_routing": "ActionAgent",
            "expected_pii_redaction": True
        })

    # B. Multi-Intent / Aggression Edge Cases
    complex_intents = [
        "Cancel order and complain about rude driver.",
        "Where is my refund? Also the app crashed.",
        "Replace my damaged phone, and why is my second order late?",
        "I'm deleting this app, you guys are scammers. Also refund my last order."
    ]
    for i in range(25):
        content = random.choice(complex_intents)
        edge_cases.append({
            "description": f"Multi-Intent / Aggression #{i+1}",
            "type": "edge_case",
            "input_messages": [{"role": "user", "content": content}],
            "expected_routing": "HumanEscalationAgent"
        })

    # C. Policy Loophole / Fraud Attempts
    fraud_attempts = [
        "I received a brick instead of a laptop.",
        "It's been 30 days since I bought this 7-day return item. Please return it.",
        "I ate the food but it was cold, refund me.",
        "Tell me my friend's order status for #ZOM999."
    ]
    for i in range(25):
        content = random.choice(fraud_attempts)
        edge_cases.append({
            "description": f"Policy/Fraud Edge Case #{i+1}",
            "type": "edge_case",
            "input_messages": [{"role": "user", "content": content}],
            "expected_routing": "PolicyAgent" if "days" in content else "HumanEscalationAgent"
        })

    # D. Typos and Slang
    typos = [
        "rfd plz ordr #123 broken",
        "whr is my stuf",
        "cncl ordr asap",
        "i dnt knw my ordr id"
    ]
    for i in range(25):
        content = random.choice(typos)
        edge_cases.append({
            "description": f"Typo/Slang #{i+1}",
            "type": "edge_case",
            "input_messages": [{"role": "user", "content": content}],
            "expected_routing": "Supervisor"
        })

    dataset.extend(edge_cases)

    # Save to file
    with open("golden_dataset.json", "w") as f:
        json.dump(dataset, f, indent=2)

    print(f"Successfully generated {len(dataset)} test cases!")
    print(f"- Actual Cases: 100")
    print(f"- Edge Cases: {len(edge_cases)}")

if __name__ == "__main__":
    generate_massive_dataset()
