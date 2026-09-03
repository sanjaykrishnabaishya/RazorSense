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
    order1 = models.Order(
        order_number="#AMZ123",
        user_id=user1.id,
        merchant_id=amazon.id,
        product_name="Wireless Earbuds",
        price=1499.0,
        transaction_id="TXN9921",
        transaction_mode="UPI"
    )
    
    # This order belongs to user 2 (John). If user 1 (Sanjay) asks about it, they should get 403 Forbidden!
    order2 = models.Order(
        order_number="#ZOM456",
        user_id=user2.id,
        merchant_id=zomato.id,
        product_name="Pizza Margherita",
        price=450.0,
        transaction_id="TXN1122",
        transaction_mode="Card"
    )

    db.add(order1)
    db.add(order2)
    db.commit()
    
    print("Database seeded successfully!")

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_db()
