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
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT,
            order_id TEXT,
            merchant TEXT,
            product TEXT,
            issue TEXT,
            date TEXT,
            status TEXT,
            action_taken TEXT
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS disputes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dispute_id TEXT UNIQUE,
            payment_id TEXT,
            order_id TEXT,
            merchant TEXT,
            product TEXT,
            amount REAL,
            currency TEXT DEFAULT 'INR',
            reason TEXT,
            status TEXT,
            evidence_summary TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    enterprise_orders = [
        ("ORD-1028", "Amazon", "boAt Rockerz 450 Bluetooth Headphones", 1499.00, "2026-01-28", "Delivered", "UPI - PhonePe"),
        ("ORD-3315", "Myntra", "Roadster Men Navy Blue Solid Denim Jacket", 1899.00, "2026-03-15", "Delivered", "Credit Card"),
        ("ORD-4410", "Flipkart", "Noise ColorFit Pulse Smartwatch", 1799.00, "2026-05-10", "Delivered", "UPI - GPay"),
        ("ORD-5671", "Amazon", "Echo Dot (5th Gen)", 4499.00, "2026-07-05", "Delivered", "Credit Card"),
        ("ORD-8923", "Amazon", "Kindle Paperwhite 16GB", 12999.00, "2026-08-10", "Delivered", "Credit Card"),
        ("ORD-6218", "Meesho", "Embroidered Anarkali Kurta Set", 749.00, "2026-08-18", "Delivered", "Cash on Delivery"),
        ("ORD-1045", "Amazon", "Sony WF-1000XM4 Noise Canceling Earbuds", 19990.00, "2026-08-25", "Delivered", "UPI - GPay"),
        ("ORD-6528", "Meesho", "Men Pure Cotton Casual Regular Shirt", 499.00, "2026-08-28", "Delivered", "UPI - Paytm"),
        ("ORD-9932", "Amazon", "Samsung Galaxy S24 Ultra 5G", 79999.00, "2026-09-02", "Delivered", "Credit Card"),
        ("ORD-3891", "Myntra", "Puma Men Black Dazzler Running Shoes", 2499.00, "2026-09-03", "Delivered", "UPI - PhonePe"),
        ("ORD-7711", "Zomato", "Margherita Pizza & Cheesy Garlic Bread", 485.00, "2026-09-04", "Delivered", "UPI - PhonePe"),
        ("ORD-5104", "Swiggy", "Hyderabadi Chicken Dum Biryani", 380.00, "2026-09-05", "Delivered", "UPI - GPay"),
        ("ORD-2110", "Blinkit", "Amul Taaza Milk (1L), Bread & Organic Eggs", 165.00, "2026-09-10", "Delivered", "UPI - Paytm"),
        ("ORD-2111", "Zepto", "Fresh Nagpur Oranges (1kg) & Robusta Bananas", 210.00, "2026-09-10", "Delivered", "UPI - PhonePe"),
        ("ORD-6714", "Meesho", "Floral Print Georgette Saree with Blouse Piece", 620.00, "2026-09-14", "Delivered", "Cash on Delivery"),
        ("ORD-5915", "Swiggy", "Cold Coffee & Dark Chocolate Brownie", 290.00, "2026-09-15", "Delivered", "UPI - PhonePe"),
        ("ORD-9116", "Flipkart", "Logitech MX Master 3S Wireless Mouse", 8495.00, "2026-09-15", "Shipped", "Credit Card")
    ]
    
    for order in enterprise_orders:
        conn.execute('''
            INSERT OR REPLACE INTO orders (order_id, merchant, product, amount, order_date, status, payment_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', order)
        
    conn.commit()
    conn.close()
    print("Enterprise database seeded successfully!")

    db = SessionLocal()

    # Create / Fetch Users
    user1 = db.query(models.User).filter_by(phone_number="9999999999").first()
    if not user1:
        user1 = models.User(phone_number="9999999999", full_name="Sanjay Krish")
        db.add(user1)
    user2 = db.query(models.User).filter_by(phone_number="8888888888").first()
    if not user2:
        user2 = models.User(phone_number="8888888888", full_name="John Doe")
        db.add(user2)
    db.commit()

    # Create / Fetch Merchants
    merchant_names = ["Amazon", "Flipkart", "Myntra", "Meesho", "Swiggy", "Zomato", "Blinkit", "Zepto"]
    merchant_map = {}
    for m_name in merchant_names:
        m_obj = db.query(models.Merchant).filter_by(name=m_name).first()
        if not m_obj:
            m_obj = models.Merchant(name=m_name)
            db.add(m_obj)
            db.commit()
            db.refresh(m_obj)
        merchant_map[m_name] = m_obj

    # Seed or sync Orders
    for idx, o in enumerate(enterprise_orders):
        order_num = o[0]
        merch_name = o[1]
        prod = o[2]
        amt = o[3]
        odate = o[4]
        stat = o[5]
        pay_mode = o[6]

        existing = db.query(models.Order).filter_by(order_number=order_num).first()
        if not existing:
            new_order = models.Order(
                order_number=order_num,
                user_id=user1.id,
                merchant_id=merchant_map[merch_name].id,
                product_name=prod,
                price=amt,
                transaction_id=f"TXN-{idx+1000}",
                transaction_mode=pay_mode,
                order_date=odate,
                status=stat
            )
            db.add(new_order)
        else:
            existing.product_name = prod
            existing.price = amt
            existing.transaction_mode = pay_mode
            existing.order_date = odate
            existing.status = stat

    db.commit()
    db.close()
    print("Main database seeded successfully!")

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_db()
