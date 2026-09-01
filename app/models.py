from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.database import Base

class DisputeStatus(str, enum.Enum):
    PENDING = "pending"
    REFUND_SCHEDULED = "refund_scheduled"
    HUMAN_INTERVENTION = "human_intervention"
    REJECTED = "rejected"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True)
    item_name = Column(String)
    price = Column(Float)
    dispatched_weight = Column(Float) # From logistics API
    order_date = Column(DateTime, default=datetime.utcnow)
    
    disputes = relationship("Dispute", back_populates="order")

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    complaint_text = Column(String)
    fraud_risk_score = Column(Float, nullable=True) # 0 to 100
    status = Column(Enum(DisputeStatus), default=DisputeStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="disputes")
