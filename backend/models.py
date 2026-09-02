from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupportTicket(BaseModel):
    """
    Schema for internal employee dashboard review.
    Maps exactly to the database schema required for issue tracking.
    """
    unique_request_id: str         # Unique request ID / Ticket ID (e.g. RZ-99413)
    user_name: str                 # User Name
    merchant_name: str             # Merchant Name (e.g. Amazon, Flipkart)
    order_id: str                  # Order ID
    transaction_id: str            # Transaction ID
    transaction_mode: str          # UPI / cash / debit or credit card
    price_of_product: float        # Price of the product
    product_name: str              # What is the product / product name
    request_details: str           # What is the request (e.g., Refund due to damaged item)
    action_taken: str              # Action taken for the case/ticket (e.g., Investigation Started)
    ticket_raise_date: datetime    # ticket raise month_day_year
    ticket_resolve_date: Optional[datetime] # ticket_resolve_month_day_year (None if pending)
    status: str                    # Current status (Pending, Resolved, In Review)

# This schema will be used to store data in the PostgreSQL database using SQLAlchemy.
