content = """
@app.get("/api/orders/search")
async def search_orders(q: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = q.lower()
    
    orders = db.query(models.Order).join(models.Merchant).filter(
        models.Order.user_id == current_user.id
    ).filter(
        (models.Order.order_number.ilike(f"%{query}%")) |
        (models.Order.product_name.ilike(f"%{query}%")) |
        (models.Merchant.name.ilike(f"%{query}%"))
    ).all()
    
    results = []
    for order in orders:
        results.append({
            "id": str(order.id),
            "merchant": order.merchant.name,
            "date": order.created_at.strftime("%d %b %Y"),
            "amount": float(order.price),
            "currency": "INR",
            "item": order.product_name,
            "status": "delivered",
            "orderId": order.order_number
        })
        
    return results
"""
with open('backend/main.py', 'a', encoding='utf-8') as f:
    f.write(content)
