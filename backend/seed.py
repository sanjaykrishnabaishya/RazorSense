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
        # --- January 2026 ---
        ("ORD-1028", "Amazon", "boAt Rockerz 450 Bluetooth Headphones", 1499.00, "2026-01-28", "Delivered", "UPI - BHIM"),
        
        # --- March 2026 ---
        ("ORD-3315", "Myntra", "Roadster Men Navy Blue Solid Denim Jacket", 1899.00, "2026-03-15", "Delivered", "CRED Pay"),
        ("ORD-6104", "Spotify", "Spotify Premium Family Plan (Annual Subscription)", 1799.00, "2026-03-25", "Delivered", "UPI - Paytm"),
        
        # --- May 2026 ---
        ("ORD-4410", "Flipkart", "Noise ColorFit Pulse Smartwatch", 1799.00, "2026-05-10", "Delivered", "UPI - Navi"),
        ("ORD-8201", "RentoMojo", "Apple MacBook Pro 16 M3 (Monthly Rental - 6 Month Tenure)", 4299.00, "2026-05-18", "Delivered", "HDFC NetBanking"),
        
        # --- July 2026 ---
        ("ORD-5671", "Amazon", "Echo Dot (5th Gen)", 4499.00, "2026-07-05", "Delivered", "HDFC Credit Card"),
        ("ORD-5501", "MakeMyTrip", "IndiGo Flight BOM to DEL (PNR: 6E-2849, Non-Stop)", 6450.00, "2026-07-12", "Delivered", "Axis Bank Credit Card"),
        ("ORD-7301", "BookMyShow", "Coldplay Music of the Spheres World Tour (2 Diamond Passes)", 14500.00, "2026-07-20", "Delivered", "CRED Pay"),
        
        # --- August 2026 ---
        ("ORD-8202", "RentoMojo", "Ergonomic Office Chair & Workstation Table (Rental)", 1199.00, "2026-08-01", "Delivered", "UPI - Navi"),
        ("ORD-5502", "Booking.com", "Taj Lands End Mumbai (2 Nights Luxury Deluxe Room)", 28900.00, "2026-08-05", "Delivered", "HDFC Credit Card"),
        ("ORD-8923", "Amazon", "Kindle Paperwhite 16GB", 12999.00, "2026-08-10", "Delivered", "ICICI NetBanking"),
        ("ORD-9401", "BGMI", "3,850 Unknown Cash (UC) + Royale Pass Season A7", 3800.00, "2026-08-15", "Delivered", "UPI - Google Pay"),
        ("ORD-6218", "Meesho", "Embroidered Anarkali Kurta Set", 749.00, "2026-08-18", "Delivered", "Cash on Delivery"),
        ("ORD-6101", "LinkedIn", "LinkedIn Premium Career Plan (Monthly Recurring)", 1499.00, "2026-08-20", "Delivered", "HDFC Credit Card Auto-Debit"),
        ("ORD-1045", "Amazon", "Sony WF-1000XM4 Noise Canceling Earbuds", 19990.00, "2026-08-25", "Delivered", "UPI - GPay"),
        ("ORD-6102", "Naukri", "Naukri FastForward Resume Display & Job Spotlight (3 Months)", 3250.00, "2026-08-26", "Delivered", "ICICI Credit Card"),
        ("ORD-6528", "Meesho", "Men Pure Cotton Casual Regular Shirt", 499.00, "2026-08-28", "Delivered", "UPI - BharatPe"),
        
        # --- September 2026 ---
        ("ORD-6103", "Netflix", "Netflix Premium 4K UHD Multi-Screen (Monthly Mandate)", 649.00, "2026-09-01", "Delivered", "CRED E-Mandate"),
        ("ORD-9932", "Amazon", "Samsung Galaxy S24 Ultra 5G", 79999.00, "2026-09-02", "Delivered", "SBI Credit Card"),
        ("ORD-3891", "Myntra", "Puma Men Black Dazzler Running Shoes", 2499.00, "2026-09-03", "Delivered", "UPI - PhonePe"),
        ("ORD-7711", "Zomato", "Margherita Pizza & Cheesy Garlic Bread", 485.00, "2026-09-04", "Delivered", "UPI - PhonePe"),
        ("ORD-5104", "Swiggy", "Hyderabadi Chicken Dum Biryani", 380.00, "2026-09-05", "Delivered", "UPI - GPay"),
        ("ORD-9402", "Free Fire", "2,180 In-Game Diamonds + Elite Pass Bundle", 1599.00, "2026-09-06", "Delivered", "UPI - BharatPe"),
        ("ORD-7302", "BookMyShow", "IMAX 3D: Interstellar Re-Release (2 Recliner Seats)", 1200.00, "2026-09-08", "Delivered", "UPI - BHIM"),
        ("ORD-2110", "Blinkit", "Amul Taaza Milk (1L), Bread & Organic Eggs", 165.00, "2026-09-10", "Delivered", "UPI - Paytm"),
        ("ORD-2111", "Zepto", "Fresh Nagpur Oranges (1kg) & Robusta Bananas", 210.00, "2026-09-10", "Delivered", "UPI - PhonePe"),
        ("ORD-5503", "ixigo", "Vande Bharat Express AC Chair Car (PNR: 2849104819)", 1680.00, "2026-09-11", "Delivered", "UPI - BHIM"),
        ("ORD-7303", "District", "Sunburn Arena EDM Music Festival Pass", 3500.00, "2026-09-12", "Delivered", "UPI - PhonePe"),
        ("ORD-6714", "Meesho", "Floral Print Georgette Saree with Blouse Piece", 620.00, "2026-09-14", "Delivered", "Cash on Delivery"),
        ("ORD-9403", "Steam", "Grand Theft Auto VI - Deluxe Edition (Pre-Order)", 5499.00, "2026-09-14", "Delivered", "SBI YONO NetBanking"),
        ("ORD-5915", "Swiggy", "Cold Coffee & Dark Chocolate Brownie", 290.00, "2026-09-15", "Delivered", "CRED UPI"),
        ("ORD-9116", "Flipkart", "Logitech MX Master 3S Wireless Mouse", 8495.00, "2026-09-15", "Shipped", "Axis Bank Credit Card")
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
    merchant_names = [
        "Amazon", "Flipkart", "Myntra", "Meesho", "Swiggy", "Zomato", "Blinkit", "Zepto",
        "RentoMojo", "BookMyShow", "District", "BGMI", "Free Fire", "Steam",
        "LinkedIn", "Naukri", "Netflix", "Spotify",
        "MakeMyTrip", "Booking.com", "ixigo"
    ]
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
            existing.merchant_id = merchant_map[merch_name].id
            existing.transaction_mode = pay_mode
            existing.order_date = odate
            existing.status = stat

    db.commit()
    db.close()
    print("Main database seeded successfully!")

if __name__ == "__main__":
    models.Base.metadata.create_all(bind=engine)
    seed_db()
