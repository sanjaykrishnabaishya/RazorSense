from database import SessionLocal, engine
import models

def seed_db():
    # ---------------------------------------------------------
    # Seed the Enterprise DB (rz_db.sqlite) ALWAYS
    # ---------------------------------------------------------
    import sqlite3
    import os
    db_path = os.path.join(os.path.dirname(__file__), 'rz_db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            merchant TEXT,
            product TEXT,
            amount REAL,
            order_date TEXT,
            status TEXT,
            payment_mode TEXT
        )
    ''')
    
    enterprise_orders = [
        ("ORD-5671", "Amazon", "Echo Dot (5th Gen)", 49.99, "2026-07-05", "Delivered", "Credit Card"),
        ("ORD-8923", "Amazon", "Kindle Paperwhite", 139.99, "2026-08-10", "Delivered", "Credit Card"),
        ("ORD-1045", "Amazon", "Sony WF-1000XM4 Earbuds", 278.00, "2026-08-25", "Delivered", "UPI - GPay"),
        ("ORD-9932", "Amazon", "Samsung Galaxy S24", 799.00, "2026-09-02", "Shipped", "Credit Card"),
        ("ORD-7711", "Zomato", "Margherita Pizza", 14.50, "2026-09-04", "Delivered", "UPI - PhonePe")
    ]
    
    for order in enterprise_orders:
        conn.execute('''
            INSERT OR IGNORE INTO orders (order_id, merchant, product, amount, order_date, status, payment_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', order)
        
    conn.commit()
    conn.close()
    print("Enterprise database seeded successfully!")

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
        models.Order(order_number="ORD-5671", user_id=user1.id, merchant_id=amazon.id, product_name="Echo Dot (5th Gen)", price=49.99, transaction_id="TXN1", transaction_mode="Credit Card", order_date="2026-07-05", status="Delivered"),
        models.Order(order_number="ORD-8923", user_id=user1.id, merchant_id=amazon.id, product_name="Kindle Paperwhite", price=139.99, transaction_id="TXN2", transaction_mode="Credit Card", order_date="2026-08-10", status="Delivered"),
        models.Order(order_number="ORD-1045", user_id=user1.id, merchant_id=amazon.id, product_name="Sony WF-1000XM4 Earbuds", price=278.00, transaction_id="TXN3", transaction_mode="UPI - GPay", order_date="2026-08-25", status="Delivered"),
        models.Order(order_number="ORD-9932", user_id=user1.id, merchant_id=amazon.id, product_name="Samsung Galaxy S24", price=799.00, transaction_id="TXN4", transaction_mode="Credit Card", order_date="2026-09-02", status="Shipped"),
        models.Order(order_number="ORD-7711", user_id=user1.id, merchant_id=zomato.id, product_name="Margherita Pizza", price=14.50, transaction_id="TXN5", transaction_mode="UPI - PhonePe", order_date="2026-09-04", status="Delivered")
    ]
    
    for o in orders:
        db.add(o)

    db.commit()
    print("Main database seeded successfully!")

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_db()
