from app.mocks import check_logistics_weight, check_payment_network, analyze_vision_evidence

def calculate_fraud_risk(order_id: int, customer_id: str, image_url: str = None) -> dict:
    """
    Calculates the final Fraud Risk Score (0-100) based on telemetry signals.
    Acts as the final Decision & Action Policy Layer.
    """
    risk_score = 0
    reasons = []

    # 1. Logistics Check
    logistics = check_logistics_weight(order_id)
    if not logistics["weight_match"]:
        risk_score += 60
        reasons.append("Logistics: Return package weight significantly lower than dispatched (Possible Empty Box).")
    
    # 2. Payment Check
    payment = check_payment_network(customer_id)
    if payment["active_bank_chargeback"]:
        risk_score += 100  # Immediate rejection trigger
        reasons.append("Payments: Active bank-level chargeback detected (Double-dip dispute attempt).")

    # 3. Vision Evidence (if provided)
    if image_url:
        vision = analyze_vision_evidence(image_url)
        risk_score += vision["vision_risk_score"]
        if vision["is_stock_photo"]:
            reasons.append("Vision: Image appears to be a downloaded stock photo.")
        if vision["detected_micro_wear"]:
            reasons.append("Vision: Detected micro-wear/usage on a returned item.")

    # Cap score at 100
    final_score = min(100, risk_score)
    
    # Resolution Decision Logic matching the user's requirements
    resolution = "HUMAN_INTERVENTION"
    if final_score < 20:
        resolution = "REFUND_SCHEDULED"
    elif final_score > 60:
        resolution = "REJECTED"

    return {
        "risk_score": final_score,
        "resolution": resolution,
        "flags": reasons
    }
