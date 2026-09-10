from database import SessionLocal, engine
import models

def seed_db():
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(models.User).first():
        print("Database already seeded.")
        return

    print("Seeding database with initial dummy data...")

    # Create Merchants
    amazon = models.Merchant(name="Amazon")
    zomato = models.Merchant(name="Zomato")
    db.add(amazon)
    db.add(zomato)
    db.commit()

    # Create Users
    user1 = models.User(phone_number="9999999999", full_name="Sanjay Krish")
    user2 = models.User(phone_number="8888888888", full_name="John Doe")
    db.add(user1)
    db.add(user2)
    db.commit()

    # Create Orders
    orders = [
        models.Order(order_number="ORD-5671", user_id=user1.id, merchant_id=amazon.id, product_name="Echo Dot (5th Gen)", price=49.99, transaction_id="TXN1", transaction_mode="Credit Card"),
        models.Order(order_number="ORD-8923", user_id=user1.id, merchant_id=amazon.id, product_name="Kindle Paperwhite", price=139.99, transaction_id="TXN2", transaction_mode="Credit Card"),
        models.Order(order_number="ORD-1045", user_id=user1.id, merchant_id=amazon.id, product_name="Sony WF-1000XM4 Earbuds", price=278.00, transaction_id="TXN3", transaction_mode="UPI - GPay"),
        models.Order(order_number="ORD-9932", user_id=user1.id, merchant_id=amazon.id, product_name="Samsung Galaxy S24", price=799.00, transaction_id="TXN4", transaction_mode="Credit Card"),
        models.Order(order_number="ORD-7711", user_id=user1.id, merchant_id=zomato.id, product_name="Margherita Pizza", price=14.50, transaction_id="TXN5", transaction_mode="UPI - PhonePe")
    ]
    
    for o in orders:
        db.add(o)


    db.commit()
    
    print("Database seeded successfully!")

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_db()
