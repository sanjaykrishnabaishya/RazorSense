import random

def check_logistics_weight(order_id: int) -> dict:
    """
    Simulates a ping to a Courier API (like Delhivery or Bluedart).
    Returns dispatched weight and final hub return weight.
    If the return weight is significantly lower, it indicates 'Empty Box' fraud.
    """
    # For MVP, randomly generate weights. 
    # If order_id ends in 9, we simulate an 'Empty Box' fraud case.
    dispatched = round(random.uniform(1.2, 5.5), 2)
    
    if order_id % 10 == 9:
        # Simulate fraud: returned box is much lighter (e.g., iPhone stolen, brick missing)
        return_weight = round(dispatched * 0.2, 2)
    else:
        # Normal: returned box is roughly the same weight
        return_weight = round(dispatched * 0.98, 2)
        
    return {
        "dispatched_weight_kg": dispatched,
        "return_weight_kg": return_weight,
        "weight_match": abs(dispatched - return_weight) < 0.5
    }

def check_payment_network(customer_id: str) -> dict:
    """
    Simulates a ping to Razorpay/NPCI API.
    Checks if the user has already initiated a bank-level chargeback.
    Prevents the "Double-Dip Dispute" fraud vector.
    """
    # Simulate a user trying to "double-dip" if their ID starts with 'FRAUD'
    has_active_chargeback = customer_id.upper().startswith("FRAUD")
    
    return {
        "active_bank_chargeback": has_active_chargeback,
        "status": "FROZEN" if has_active_chargeback else "CLEARED"
    }

def analyze_vision_evidence(image_url: str) -> dict:
    """
    Simulates sending an image to a multimodal vision model for forensic analysis.
    Checks for EXIF manipulation, downloaded stock photos, and micro-wear.
    """
    # For MVP, we use simple string matching on the dummy URL to trigger fraud flags
    is_stock_photo = "google" in image_url.lower() or "stock" in image_url.lower()
    has_micro_wear = "worn" in image_url.lower() or "used" in image_url.lower()
    
    risk_score = 0
    if is_stock_photo: risk_score += 80
    if has_micro_wear: risk_score += 40
    
    return {
        "is_stock_photo": is_stock_photo,
        "detected_micro_wear": has_micro_wear,
        "vision_risk_score": min(100, risk_score),
        "analysis_notes": "Image metadata indicates download from external source (Stock/Google)." if is_stock_photo else "Image appears organically captured."
    }
