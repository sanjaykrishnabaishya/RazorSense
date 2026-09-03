from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String)
    
    orders = relationship("Order", back_populates="owner")
    tickets = relationship("SupportTicket", back_populates="owner")

class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    orders = relationship("Order", back_populates="merchant")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True) # e.g., #AMZ123
    user_id = Column(Integer, ForeignKey("users.id"))
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    
    product_name = Column(String)
    price = Column(Float)
    transaction_id = Column(String)
    transaction_mode = Column(String) # UPI, Card, COD
    order_date = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="orders")
    merchant = relationship("Merchant", back_populates="orders")

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True) # RZ-99413
    user_id = Column(Integer, ForeignKey("users.id"))
    order_number = Column(String) # Denormalized for easy access
    merchant_name = Column(String)
    
    request_details = Column(String)
    action_taken = Column(String)
    status = Column(String, default="Pending") # Pending, In Review, Resolved
    
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    owner = relationship("User", back_populates="tickets")
