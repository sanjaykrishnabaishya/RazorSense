import json

try:
    from datasets import load_dataset
except ImportError:
    print("Please install the datasets library: pip install datasets")
    exit(1)

def fetch_and_append_huggingface_data():
    """
    Connects to the popular Hugging Face 'Bitext/customer-support-intent-dataset'
    and pulls real-world e-commerce utterances to expand our Golden Dataset.
    """
    print("Connecting to Hugging Face to download real e-commerce agent routing data...")
    
    # Load functiongemma e-commerce dataset
    dataset = load_dataset("scionoftech/functiongemma-e-commerce-dataset", split="train[:30]")
    
    new_cases = []
    
    for row in dataset:
        utterance = row['query']
        function_call = row['function_call'] # e.g. manage_order, process_return
        
        expected_routing = "Supervisor"
        if "process_return" in function_call or "refund" in function_call:
            expected_routing = "ActionAgent"
        elif "policy" in function_call:
            expected_routing = "PolicyAgent"
        elif "order" in function_call or "track" in function_call:
            expected_routing = "OrderAgent"
            
        new_cases.append({
            "description": f"Real-world data (HF Dataset)",
            "input_messages": [{"role": "user", "content": utterance}],
            "expected_routing": expected_routing,
            "source": "huggingface/scionoftech-ecommerce"
        })
        
    print(f"Fetched {len(new_cases)} real-world examples.")
    
    # Append to existing golden_dataset.json
    try:
        with open("golden_dataset.json", "r") as f:
            existing_data = json.load(f)
    except FileNotFoundError:
        existing_data = []
        
    existing_data.extend(new_cases)
    
    with open("golden_dataset.json", "w") as f:
        json.dump(existing_data, f, indent=2)
        
    print("Successfully expanded golden_dataset.json with real public data!")

if __name__ == "__main__":
    fetch_and_append_huggingface_data()
